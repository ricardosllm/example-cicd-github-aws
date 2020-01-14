#!/usr/bin/env node
import cdk = require('@aws-cdk/core');
import codebuild = require('@aws-cdk/aws-codebuild');
import codepipeline = require('@aws-cdk/aws-codepipeline');
import codepipeline_actions = require('@aws-cdk/aws-codepipeline-actions');
import iam = require('@aws-cdk/aws-iam');
import { Construct } from '@aws-cdk/core';
// import { App, Stack, StackProps } from '@aws-cdk/core';

export interface PipelineProps {
  sourceToken: string;
  cfnTemplate: string;
  serviceRole: string;
}

export class Pipeline extends Construct {
  constructor(parent: Construct, name: string, props: PipelineProps) {
    super(parent, name);

    const sourceOutput = new codepipeline.Artifact();
    const sourceAction = new codepipeline_actions.GitHubSourceAction({
      actionName: 'Get_Source',
      owner: 'ricardosllm',
      repo: 'example-cicd-github-aws',
      oauthToken: cdk.SecretValue.secretsManager(props.sourceToken),
      output: sourceOutput,
      branch: 'master',
      // default: 'WEBHOOK', 'NONE' is also possible for no Source trigger
      trigger: codepipeline_actions.GitHubTrigger.WEBHOOK
    });

    const cdkRole = iam.Role.fromRoleArn(this, 'cdkRole', props.serviceRole);

    const cdkBuildDeploy = new codebuild.PipelineProject(this, 'CdkBuild', {
      role: cdkRole,
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            commands: 'npm install',
          },
          build: {
            commands: [
              'npm run build',
              './node_modules/.bin/cdk synth -o dist',
              './node_modules/.bin/cdk deploy MyStaticSite --require-approval never'
            ],
          },
        },
        artifacts: {
          'base-directory': 'cdk.out',
          files: [
            props.cfnTemplate,
          ],
        },
      }),
      environment: {
        buildImage: codebuild.LinuxBuildImage.UBUNTU_14_04_NODEJS_10_14_1,
      },
    });
    const cdkBuildDeployOutput = new codepipeline.Artifact('CdkBuildOutput');
    const cdkBuildDeployAction = new codepipeline_actions.CodeBuildAction({
      actionName: 'Build_and_Deploy',
      project: cdkBuildDeploy,
      input: sourceOutput,
      outputs: [cdkBuildDeployOutput],
    });

    new codepipeline.Pipeline(this, 'Pipeline', {
      stages: [
        {
          stageName: 'Source',
          actions: [ sourceAction ],
        },
        {
          stageName: 'Build',
          actions: [ cdkBuildDeployAction ],
        },
      ],
    });
  }
}

