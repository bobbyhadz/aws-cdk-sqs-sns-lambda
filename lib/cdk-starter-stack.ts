import * as lambda from '@aws-cdk/aws-lambda';
import {SqsEventSource} from '@aws-cdk/aws-lambda-event-sources';
import {NodejsFunction} from '@aws-cdk/aws-lambda-nodejs';
import * as sns from '@aws-cdk/aws-sns';
import * as subs from '@aws-cdk/aws-sns-subscriptions';
import * as sqs from '@aws-cdk/aws-sqs';
import * as cdk from '@aws-cdk/core';
import * as path from 'path';

export class CdkStarterStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 👇 create DLQ lambda function
    const dlqLambda = new NodejsFunction(this, 'dlq-lambda', {
      memorySize: 1024,
      timeout: cdk.Duration.seconds(5),
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'main',
      entry: path.join(__dirname, `/../src/dlq-lambda/index.ts`),
    });

    // 👇 create dead letter queue
    const deadLetterQueue = new sqs.Queue(this, 'dead-letter-queue', {
      retentionPeriod: cdk.Duration.minutes(30),
    });

    // 👇 add dead letter queue as event source for dlq lambda function
    dlqLambda.addEventSource(new SqsEventSource(deadLetterQueue));

    // 👇 create queue
    const queue = new sqs.Queue(this, 'sqs-queue', {
      visibilityTimeout: cdk.Duration.seconds(300),
    });

    // 👇 create sns topic
    const topic = new sns.Topic(this, 'sns-topic');

    // 👇 subscribe queue to topic
    topic.addSubscription(new subs.SqsSubscription(queue));

    // 👇 create lambda function
    const myLambda = new NodejsFunction(this, 'my-lambda', {
      memorySize: 1024,
      timeout: cdk.Duration.seconds(5),
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'main',
      entry: path.join(__dirname, `/../src/my-lambda/index.ts`),
      deadLetterQueue,
    });

    // 👇 add sqs queue as event source for lambda
    myLambda.addEventSource(
      new SqsEventSource(queue, {
        batchSize: 10,
      }),
    );

    new cdk.CfnOutput(this, 'snsTopicArn', {
      value: topic.topicArn,
      description: 'The arn of the SNS topic',
    });
  }
}
