import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as Cdk from '../lib/cdk-stack';

test('Empty Stack', () => {
  const app = new cdk.App();
  // WHEN
  //const domainName = process.env.DOMAIN_NAME ? process.env.DOMAIN_NAME : 'trivia-api.ecs.demo3.allamand.com';
  const domainZone = process.env.DOMAIN_ZONE ? process.env.DOMAIN_ZONE : 'ecs.demo3.allamand.com';
  const vpcTagName = process.env.VPC_TAG_NAME ? process.env.VPC_TAG_NAME : 'JenkinsKanikoStack/jenkins-vpc';
  const existingClusterName = process.env.CLUSTER_NAME ? process.env.CLUSTER_NAME : 'jenkins-cluster';

  const stack = new Cdk.TriviaBackendStack(app, 'MyTestStack', {
    //domainName: domainName,
    domainZone: domainZone,
    vpcTagName: vpcTagName,
    existingClusterName: existingClusterName,
    env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  });
  // THEN
  expectCDK(stack).to(
    matchTemplate(
      {
        Resources: {},
      },
      MatchStyle.EXACT
    )
  );
});
