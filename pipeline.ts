#!/usr/bin/env node
import cdk = require('@aws-cdk/core');
import codebuild = require('@aws-cdk/aws-codebuild');
import codepipeline = require('@aws-cdk/aws-codepipeline');
import codepipeline_actions = require('@aws-cdk/aws-codepipeline-actions');
import { Construct } from '@aws-cdk/core';
// import { App, Stack, StackProps } from '@aws-cdk/core';

export interface PipelineProps {
  sourceToken: string;
  cfnTemplate: string;
}

export class Pipeline extends Construct {
  constructor(parent: Construct, name: string, props: PipelineProps) {
    super(parent, name);

    const sourceOutput = new codepipeline.Artifact();
    const sourceAction = new codepipeline_actions.GitHubSourceAction({
      actionName: 'GitHub_Source',
      owner: 'ricardosllm',
      repo: 'example-cicd-github-aws',
      oauthToken: cdk.SecretValue.secretsManager(props.sourceToken),
      output: sourceOutput,
      branch: 'master',
      // default: 'WEBHOOK', 'NONE' is also possible for no Source trigger
      trigger: codepipeline_actions.GitHubTrigger.WEBHOOK
    });

    const cdkBuild = new codebuild.PipelineProject(this, 'CdkBuild', {
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            commands: 'npm install',
          },
          build: {
            commands: [
              'npm run build',
              'cdk synth'
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
    const cdkBuildOutput = new codepipeline.Artifact('CdkBuildOutput');
    const cdkBuildAction = new codepipeline_actions.CodeBuildAction({
      actionName: 'CDK_Build',
      project: cdkBuild,
      input: sourceOutput,
      outputs: [cdkBuildOutput],
    });

    // Not doing anything atm as there's nothing to build from the static site. TODO
    const SiteBuild = new codebuild.PipelineProject(this, 'SiteBuild', {
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            commands: [
              'cd site-contents',
            ],
          },
          build: {
            commands: 'echo "Nothing to do here..."', // TODO: examplify site building
          },
        },
        artifacts: {
          'base-directory': 'site-contents',
          files: [
            'index.html',
            'error.html',
          ],
        },
      }),
      environment: {
        buildImage: codebuild.LinuxBuildImage.UBUNTU_14_04_NODEJS_10_14_1,
      },
    });
    const siteBuildOutput = new codepipeline.Artifact('SiteBuildOutput');
    const siteBuildAction = new codepipeline_actions.CodeBuildAction({
      actionName: 'Site_Build',
      project: SiteBuild,
      input: sourceOutput,
      outputs: [siteBuildOutput],
    });

    const deployAction = new codepipeline_actions.CloudFormationCreateUpdateStackAction({
      actionName: 'Site_CFN_Deploy',
      templatePath: cdkBuildOutput.atPath(props.cfnTemplate),
      stackName: 'SiteDeploymentStack',
      adminPermissions: true,
      extraInputs: [siteBuildOutput],
    });

    new codepipeline.Pipeline(this, 'Pipeline', {
      stages: [
        {
          stageName: 'Source',
          actions: [ sourceAction ],
        },
        {
          stageName: 'Build',
          actions: [
            cdkBuildAction,
            siteBuildAction
          ],
        },
        {
          stageName: 'Deploy',
          actions: [ deployAction ],
        },
      ],
    });
  }
}

