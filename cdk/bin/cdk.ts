#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { TriviaBackendStack } from '../lib/cdk-stack';

const app = new cdk.App();

//const domainName = process.env.DOMAIN_NAME ? process.env.DOMAIN_NAME : 'trivia-api.ecs.demo3.allamand.com';
const domainZone = process.env.DOMAIN_ZONE ? process.env.DOMAIN_ZONE : 'ecs.demo3.allamand.com';
const vpcTagName = process.env.VPC_TAG_NAME ? process.env.VPC_TAG_NAME : 'JenkinsKanikoStack/jenkins-vpc';
const existingClusterName = process.env.CLUSTER_NAME ? process.env.CLUSTER_NAME : 'jenkins-cluster';

new TriviaBackendStack(app, 'TriviaBackendStack', {
  //domainName: domainName,
  domainZone: domainZone,
  vpcTagName: vpcTagName,
  existingClusterName: existingClusterName,
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});
