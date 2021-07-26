# Trivia API

This repo is used to showcase how you can create Preview version of this repo for each Branch using preview-bot.

You might be familiar with the concept of preview deployment from frontend tooling that allows you to create a preview of you application before they are merged into a production website.

This patterns could also easilly be extended to any backend services or event whole infrasstructure.

You can uses Preview Deployment in combination with whatever existing CI/CD for stages like production and staging.
Because you're spinning up an entire set of infrastructure, it's open for your code reviewers to play with your enpoints and infrastructure resources. You can run automated or manual tests in thoses preview environments, without impacting other environment like other preview or existing staging environment.

## Infrastructure as code for our application

In this sample, I showcase how you can uses [CDK](https://aws.amazon.com/cdk/) to build Infrastructure as code [CloudFormation](https://aws.amazon.com/cloudformation/) template that can then be automatically deployed to your AWS Account.

In this démo, our CDK application will do:

- Create an [Amazon Elastic Container Service](https://aws.amazon.com/ecs/?whats-new-cards.sort-by=item.additionalFields.postDateTime&whats-new-cards.sort-order=desc&ecs-blogs.sort-by=item.additionalFields.createdDate&ecs-blogs.sort-order=desc)] to expose our new application
- The service will also create an Application Load Balancer to exposes the service
- The service will be expose in https with an [AWS Certificate Manager](https://aws.amazon.com/certificate-manager/) on our domain in wildcard
- The CDK will also create a Route53 alias allowing us to expose our services on a predictable domain name.
- It can either create a new VPC or deploy in an existing VPC as in this example.

All the CDK code is defined in the `cdk`directory.

## Automation

What we want is the ability to automatically create preview branch of our application, using our cdk infrasstructure as code deployment method, for each branch that we will be created.
Once the feature branch is merged, we want the preview deployment to be automatically destroyed, and we want our targeted "production" environment to be deployed from up to date master branch.

In this project, we are shocasing 2 method for making this happened:

1. Using a Github Bot
2. Using Github Workflow

> You'll also have lots of others options like CodePipeline, GitlabCI, CircleCI, Travis...

### With Github Bot

We are leveraging [preview-bot](https://github.com/allamand/preview-bot) project. This project allows you to deploy the preview-bot in an existing ECS cluster.
The bot will watch this repository looking for @mention of the preview bot

```
@preview-bot preview this
```

When you mention the preview-bot in a Github Pull Request, then, the bot will:

- Build the docker image and store it in a special ECR repository
- Generate the CloudFormation template automatically from your cdk code.
- Deploy your preview environment with CloudFormation.
- If you configure a route53 domain and an AWS Certificate wildcard, then you will be able to access youre preview url in Https on your custom domain (see below).

When you delete the branch, the bot will automatically destroy the environment you prevously created.

> If you don't want to create a preview environment from your PR, just don't mention the `preview-bot`.

### With Github Workflow

I have configured this project to also be able to deploy a preview environment automatically when we label the Pull Request with the `preview-bot` label.

With the same mechanism that with `preview-bot` the Github Action will:

- build the docker image for our API
- generate the cloudformation template from cdk
- deploy the cloudformation stack from the generated template.

When you close the Pull Request, it will:

- delete the preview environment
- generate the docker image for the main branch
- generate the cloudformation template from cdk for the main environment
- deploy the main environment from the cloudformation template

> If you do'nt want to create a preview environment from your Pull Request, just don't label the PR with `preview-bot`

## Sample API demo

The preview url would be created in the form :

`https://preview-${{ github.event.repository.owner.login }}-${{ github.event.repository.name }}-pr-${{ github.event.number }}.DOMAIN_NAME`

some features of Trivia API examples:

- https://allamand-trivia-api-pr-1.ecs.demo3.allamand.com/api/trivia/all
- https://allamand-trivia-api-pr-1.ecs.demo3.allamand.com/api/trivia/question/3
- https://allamand-trivia-api-pr-1.ecs.demo3.allamand.com/health
-
