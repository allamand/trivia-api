import * as cdk from '@aws-cdk/core';
import { Repository } from '@aws-cdk/aws-ecr';
import { ApplicationLoadBalancedFargateService } from '@aws-cdk/aws-ecs-patterns';
import { CfnOutput, Duration } from '@aws-cdk/core';
import { Vpc } from '@aws-cdk/aws-ec2';
import { Cluster, ContainerImage, PropagatedTagSource } from '@aws-cdk/aws-ecs';
import { HostedZone } from '@aws-cdk/aws-route53';
import { StringParameter } from '@aws-cdk/aws-ssm';
import { Certificate } from '@aws-cdk/aws-certificatemanager';

interface TriviaBackendStackProps extends cdk.StackProps {
  vpcTagName?: string; // Specify if you want to reuse existing VPC (or "default" for default VPC), else it will create a new one
  existingClusterName?: string; // Specify if you want to reuse existing ECS cluster, else it will create new one
  //domainName: string;
  domainZone: string;
}

export class TriviaBackendStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: TriviaBackendStackProps) {
    super(scope, id, props);

    // Configuration parameters
    const repoName = process.env.ECR_REPOSITORY ? process.env.ECR_REPOSITORY : 'need-to-configure-ECR_REPOSITORY';
    const tag = process.env.IMAGE_TAG ? process.env.IMAGE_TAG : 'latest';
    const domainZone = HostedZone.fromLookup(this, 'Zone', { domainName: props.domainZone });
    const imageRepo = Repository.fromRepositoryName(this, 'Repo', repoName);
    const image = ContainerImage.fromEcrRepository(imageRepo, tag);

    var vpc = undefined;
    if (props.vpcTagName) {
      if (props.vpcTagName == 'default') {
        vpc = Vpc.fromLookup(this, 'VPC', { isDefault: true });
      } else {
        vpc = Vpc.fromLookup(this, 'VPC', { tags: { Name: props.vpcTagName } });
      }
    } else {
      vpc = new Vpc(this, 'VPC', { maxAzs: 2 });
    }
    //new CfnOutput(this, 'VpcID', { value: vpc.vpcId });

    // Reference existing network and cluster infrastructure
    var cluster = undefined;
    if (props.existingClusterName) {
      cluster = Cluster.fromClusterAttributes(this, 'Cluster', {
        clusterName: props.existingClusterName,
        //vpc: new ec2.VpcNetworkProvider(this, { isDefault: true }).vpcProps,
        vpc: vpc,
        securityGroups: [],
      });
    } else {
      cluster = new Cluster(this, 'Cluster', {
        clusterName: tag + '-' + props.domainZone.replace(/\./g, '-'),
        vpc,
        containerInsights: true,
      });
    }
    new CfnOutput(this, 'ClusterName', { value: cluster.clusterName });

    // Lookup pre-existing TLS certificate
    const certificateArn = StringParameter.fromStringParameterAttributes(this, 'CertArnParameter', {
      parameterName: 'CertificateArn-' + props.domainZone,
    }).stringValue;
    const certificate = Certificate.fromCertificateArn(this, 'Cert', certificateArn);
    //don't share internal aws identifier
    //new CfnOutput(this, 'CertificatArn', { value: certificate.certificateArn });

    // Create Fargate service + load balancer
    const service = new ApplicationLoadBalancedFargateService(this, 'Service', {
      cluster,
      taskImageOptions: {
        image,
      },
      desiredCount: 1,
      domainName: tag + '.' + props.domainZone,
      domainZone,
      certificate,
      propagateTags: PropagatedTagSource.SERVICE,
    });
    new CfnOutput(this, 'EcsService', { value: service.service.serviceName });
    //new CfnOutput(this, 'ServiceURLCustom', { value: 'https://' + tag + '.' + props.domainZone });

    // Speed up deployments
    service.targetGroup.setAttribute('deregistration_delay.timeout_seconds', '30');
    service.targetGroup.configureHealthCheck({
      interval: Duration.seconds(5),
      healthyHttpCodes: '200',
      healthyThresholdCount: 2,
      unhealthyThresholdCount: 3,
      timeout: Duration.seconds(4),
    });
    // new cdk.CfnOutput(this, 'ServiceURL', {
    //   value: 'http://' + service.loadBalancer.loadBalancerDnsName,
    // });
  }
}
