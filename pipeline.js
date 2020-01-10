#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cdk = require("@aws-cdk/core");
const codebuild = require("@aws-cdk/aws-codebuild");
const codepipeline = require("@aws-cdk/aws-codepipeline");
const codepipeline_actions = require("@aws-cdk/aws-codepipeline-actions");
const core_1 = require("@aws-cdk/core");
class Pipeline extends core_1.Construct {
    constructor(parent, name, props) {
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
                role: props.serviceRole,
                phases: {
                    install: {
                        commands: 'npm install',
                    },
                    build: {
                        commands: [
                            'env',
                            'npm run build',
                            './node_modules/.bin/cdk synth'
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
                role: props.serviceRole,
                phases: {
                    install: {
                        commands: [
                            'cd site-contents',
                        ],
                    },
                    build: {
                        commands: 'echo "Nothing to do here..."',
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
                    actions: [sourceAction],
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
                    actions: [deployAction],
                },
            ],
        });
    }
}
exports.Pipeline = Pipeline;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGlwZWxpbmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJwaXBlbGluZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSxxQ0FBc0M7QUFDdEMsb0RBQXFEO0FBQ3JELDBEQUEyRDtBQUMzRCwwRUFBMkU7QUFDM0Usd0NBQTBDO0FBUzFDLE1BQWEsUUFBUyxTQUFRLGdCQUFTO0lBQ3JDLFlBQVksTUFBaUIsRUFBRSxJQUFZLEVBQUUsS0FBb0I7UUFDL0QsS0FBSyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztRQUVwQixNQUFNLFlBQVksR0FBRyxJQUFJLFlBQVksQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUNqRCxNQUFNLFlBQVksR0FBRyxJQUFJLG9CQUFvQixDQUFDLGtCQUFrQixDQUFDO1lBQy9ELFVBQVUsRUFBRSxlQUFlO1lBQzNCLEtBQUssRUFBRSxhQUFhO1lBQ3BCLElBQUksRUFBRSx5QkFBeUI7WUFDL0IsVUFBVSxFQUFFLEdBQUcsQ0FBQyxXQUFXLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUM7WUFDN0QsTUFBTSxFQUFFLFlBQVk7WUFDcEIsTUFBTSxFQUFFLFFBQVE7WUFDaEIsb0VBQW9FO1lBQ3BFLE9BQU8sRUFBRSxvQkFBb0IsQ0FBQyxhQUFhLENBQUMsT0FBTztTQUNwRCxDQUFDLENBQUM7UUFFSCxNQUFNLFFBQVEsR0FBRyxJQUFJLFNBQVMsQ0FBQyxlQUFlLENBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRTtZQUMvRCxTQUFTLEVBQUUsU0FBUyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUM7Z0JBQ3hDLE9BQU8sRUFBRSxLQUFLO2dCQUNkLElBQUksRUFBRSxLQUFLLENBQUMsV0FBVztnQkFDdkIsTUFBTSxFQUFFO29CQUNOLE9BQU8sRUFBRTt3QkFDUCxRQUFRLEVBQUUsYUFBYTtxQkFDeEI7b0JBQ0QsS0FBSyxFQUFFO3dCQUNMLFFBQVEsRUFBRTs0QkFDUixLQUFLOzRCQUNMLGVBQWU7NEJBQ2YsK0JBQStCO3lCQUNoQztxQkFDRjtpQkFDRjtnQkFDRCxTQUFTLEVBQUU7b0JBQ1QsZ0JBQWdCLEVBQUUsU0FBUztvQkFDM0IsS0FBSyxFQUFFO3dCQUNMLEtBQUssQ0FBQyxXQUFXO3FCQUNsQjtpQkFDRjthQUNGLENBQUM7WUFDRixXQUFXLEVBQUU7Z0JBQ1gsVUFBVSxFQUFFLFNBQVMsQ0FBQyxlQUFlLENBQUMsMkJBQTJCO2FBQ2xFO1NBQ0YsQ0FBQyxDQUFDO1FBQ0gsTUFBTSxjQUFjLEdBQUcsSUFBSSxZQUFZLENBQUMsUUFBUSxDQUFDLGdCQUFnQixDQUFDLENBQUM7UUFDbkUsTUFBTSxjQUFjLEdBQUcsSUFBSSxvQkFBb0IsQ0FBQyxlQUFlLENBQUM7WUFDOUQsVUFBVSxFQUFFLFdBQVc7WUFDdkIsT0FBTyxFQUFFLFFBQVE7WUFDakIsS0FBSyxFQUFFLFlBQVk7WUFDbkIsT0FBTyxFQUFFLENBQUMsY0FBYyxDQUFDO1NBQzFCLENBQUMsQ0FBQztRQUVILGdGQUFnRjtRQUNoRixNQUFNLFNBQVMsR0FBRyxJQUFJLFNBQVMsQ0FBQyxlQUFlLENBQUMsSUFBSSxFQUFFLFdBQVcsRUFBRTtZQUNqRSxTQUFTLEVBQUUsU0FBUyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUM7Z0JBQ3hDLE9BQU8sRUFBRSxLQUFLO2dCQUNkLElBQUksRUFBRSxLQUFLLENBQUMsV0FBVztnQkFDdkIsTUFBTSxFQUFFO29CQUNOLE9BQU8sRUFBRTt3QkFDUCxRQUFRLEVBQUU7NEJBQ1Isa0JBQWtCO3lCQUNuQjtxQkFDRjtvQkFDRCxLQUFLLEVBQUU7d0JBQ0wsUUFBUSxFQUFFLDhCQUE4QjtxQkFDekM7aUJBQ0Y7Z0JBQ0QsU0FBUyxFQUFFO29CQUNULGdCQUFnQixFQUFFLGVBQWU7b0JBQ2pDLEtBQUssRUFBRTt3QkFDTCxZQUFZO3dCQUNaLFlBQVk7cUJBQ2I7aUJBQ0Y7YUFDRixDQUFDO1lBQ0YsV0FBVyxFQUFFO2dCQUNYLFVBQVUsRUFBRSxTQUFTLENBQUMsZUFBZSxDQUFDLDJCQUEyQjthQUNsRTtTQUNGLENBQUMsQ0FBQztRQUNILE1BQU0sZUFBZSxHQUFHLElBQUksWUFBWSxDQUFDLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1FBQ3JFLE1BQU0sZUFBZSxHQUFHLElBQUksb0JBQW9CLENBQUMsZUFBZSxDQUFDO1lBQy9ELFVBQVUsRUFBRSxZQUFZO1lBQ3hCLE9BQU8sRUFBRSxTQUFTO1lBQ2xCLEtBQUssRUFBRSxZQUFZO1lBQ25CLE9BQU8sRUFBRSxDQUFDLGVBQWUsQ0FBQztTQUMzQixDQUFDLENBQUM7UUFFSCxNQUFNLFlBQVksR0FBRyxJQUFJLG9CQUFvQixDQUFDLHFDQUFxQyxDQUFDO1lBQ2xGLFVBQVUsRUFBRSxpQkFBaUI7WUFDN0IsWUFBWSxFQUFFLGNBQWMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQztZQUN0RCxTQUFTLEVBQUUscUJBQXFCO1lBQ2hDLGdCQUFnQixFQUFFLElBQUk7WUFDdEIsV0FBVyxFQUFFLENBQUMsZUFBZSxDQUFDO1NBQy9CLENBQUMsQ0FBQztRQUVILElBQUksWUFBWSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsVUFBVSxFQUFFO1lBQzFDLE1BQU0sRUFBRTtnQkFDTjtvQkFDRSxTQUFTLEVBQUUsUUFBUTtvQkFDbkIsT0FBTyxFQUFFLENBQUUsWUFBWSxDQUFFO2lCQUMxQjtnQkFDRDtvQkFDRSxTQUFTLEVBQUUsT0FBTztvQkFDbEIsT0FBTyxFQUFFO3dCQUNQLGNBQWM7d0JBQ2QsZUFBZTtxQkFDaEI7aUJBQ0Y7Z0JBQ0Q7b0JBQ0UsU0FBUyxFQUFFLFFBQVE7b0JBQ25CLE9BQU8sRUFBRSxDQUFFLFlBQVksQ0FBRTtpQkFDMUI7YUFDRjtTQUNGLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQWxIRCw0QkFrSEMiLCJzb3VyY2VzQ29udGVudCI6WyIjIS91c3IvYmluL2VudiBub2RlXG5pbXBvcnQgY2RrID0gcmVxdWlyZSgnQGF3cy1jZGsvY29yZScpO1xuaW1wb3J0IGNvZGVidWlsZCA9IHJlcXVpcmUoJ0Bhd3MtY2RrL2F3cy1jb2RlYnVpbGQnKTtcbmltcG9ydCBjb2RlcGlwZWxpbmUgPSByZXF1aXJlKCdAYXdzLWNkay9hd3MtY29kZXBpcGVsaW5lJyk7XG5pbXBvcnQgY29kZXBpcGVsaW5lX2FjdGlvbnMgPSByZXF1aXJlKCdAYXdzLWNkay9hd3MtY29kZXBpcGVsaW5lLWFjdGlvbnMnKTtcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ0Bhd3MtY2RrL2NvcmUnO1xuLy8gaW1wb3J0IHsgQXBwLCBTdGFjaywgU3RhY2tQcm9wcyB9IGZyb20gJ0Bhd3MtY2RrL2NvcmUnO1xuXG5leHBvcnQgaW50ZXJmYWNlIFBpcGVsaW5lUHJvcHMge1xuICBzb3VyY2VUb2tlbjogc3RyaW5nO1xuICBjZm5UZW1wbGF0ZTogc3RyaW5nO1xuICBzZXJ2aWNlUm9sZTogc3RyaW5nO1xufVxuXG5leHBvcnQgY2xhc3MgUGlwZWxpbmUgZXh0ZW5kcyBDb25zdHJ1Y3Qge1xuICBjb25zdHJ1Y3RvcihwYXJlbnQ6IENvbnN0cnVjdCwgbmFtZTogc3RyaW5nLCBwcm9wczogUGlwZWxpbmVQcm9wcykge1xuICAgIHN1cGVyKHBhcmVudCwgbmFtZSk7XG5cbiAgICBjb25zdCBzb3VyY2VPdXRwdXQgPSBuZXcgY29kZXBpcGVsaW5lLkFydGlmYWN0KCk7XG4gICAgY29uc3Qgc291cmNlQWN0aW9uID0gbmV3IGNvZGVwaXBlbGluZV9hY3Rpb25zLkdpdEh1YlNvdXJjZUFjdGlvbih7XG4gICAgICBhY3Rpb25OYW1lOiAnR2l0SHViX1NvdXJjZScsXG4gICAgICBvd25lcjogJ3JpY2FyZG9zbGxtJyxcbiAgICAgIHJlcG86ICdleGFtcGxlLWNpY2QtZ2l0aHViLWF3cycsXG4gICAgICBvYXV0aFRva2VuOiBjZGsuU2VjcmV0VmFsdWUuc2VjcmV0c01hbmFnZXIocHJvcHMuc291cmNlVG9rZW4pLFxuICAgICAgb3V0cHV0OiBzb3VyY2VPdXRwdXQsXG4gICAgICBicmFuY2g6ICdtYXN0ZXInLFxuICAgICAgLy8gZGVmYXVsdDogJ1dFQkhPT0snLCAnTk9ORScgaXMgYWxzbyBwb3NzaWJsZSBmb3Igbm8gU291cmNlIHRyaWdnZXJcbiAgICAgIHRyaWdnZXI6IGNvZGVwaXBlbGluZV9hY3Rpb25zLkdpdEh1YlRyaWdnZXIuV0VCSE9PS1xuICAgIH0pO1xuXG4gICAgY29uc3QgY2RrQnVpbGQgPSBuZXcgY29kZWJ1aWxkLlBpcGVsaW5lUHJvamVjdCh0aGlzLCAnQ2RrQnVpbGQnLCB7XG4gICAgICBidWlsZFNwZWM6IGNvZGVidWlsZC5CdWlsZFNwZWMuZnJvbU9iamVjdCh7XG4gICAgICAgIHZlcnNpb246ICcwLjInLFxuICAgICAgICByb2xlOiBwcm9wcy5zZXJ2aWNlUm9sZSxcbiAgICAgICAgcGhhc2VzOiB7XG4gICAgICAgICAgaW5zdGFsbDoge1xuICAgICAgICAgICAgY29tbWFuZHM6ICducG0gaW5zdGFsbCcsXG4gICAgICAgICAgfSxcbiAgICAgICAgICBidWlsZDoge1xuICAgICAgICAgICAgY29tbWFuZHM6IFtcbiAgICAgICAgICAgICAgJ2VudicsIC8vIFRPRE86IHJlbW92ZSBhZnRlciBkZWJ1Z2dpbmdcbiAgICAgICAgICAgICAgJ25wbSBydW4gYnVpbGQnLFxuICAgICAgICAgICAgICAnLi9ub2RlX21vZHVsZXMvLmJpbi9jZGsgc3ludGgnXG4gICAgICAgICAgICBdLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIGFydGlmYWN0czoge1xuICAgICAgICAgICdiYXNlLWRpcmVjdG9yeSc6ICdjZGsub3V0JyxcbiAgICAgICAgICBmaWxlczogW1xuICAgICAgICAgICAgcHJvcHMuY2ZuVGVtcGxhdGUsXG4gICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgIH0pLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgYnVpbGRJbWFnZTogY29kZWJ1aWxkLkxpbnV4QnVpbGRJbWFnZS5VQlVOVFVfMTRfMDRfTk9ERUpTXzEwXzE0XzEsXG4gICAgICB9LFxuICAgIH0pO1xuICAgIGNvbnN0IGNka0J1aWxkT3V0cHV0ID0gbmV3IGNvZGVwaXBlbGluZS5BcnRpZmFjdCgnQ2RrQnVpbGRPdXRwdXQnKTtcbiAgICBjb25zdCBjZGtCdWlsZEFjdGlvbiA9IG5ldyBjb2RlcGlwZWxpbmVfYWN0aW9ucy5Db2RlQnVpbGRBY3Rpb24oe1xuICAgICAgYWN0aW9uTmFtZTogJ0NES19CdWlsZCcsXG4gICAgICBwcm9qZWN0OiBjZGtCdWlsZCxcbiAgICAgIGlucHV0OiBzb3VyY2VPdXRwdXQsXG4gICAgICBvdXRwdXRzOiBbY2RrQnVpbGRPdXRwdXRdLFxuICAgIH0pO1xuXG4gICAgLy8gTm90IGRvaW5nIGFueXRoaW5nIGF0bSBhcyB0aGVyZSdzIG5vdGhpbmcgdG8gYnVpbGQgZnJvbSB0aGUgc3RhdGljIHNpdGUuIFRPRE9cbiAgICBjb25zdCBTaXRlQnVpbGQgPSBuZXcgY29kZWJ1aWxkLlBpcGVsaW5lUHJvamVjdCh0aGlzLCAnU2l0ZUJ1aWxkJywge1xuICAgICAgYnVpbGRTcGVjOiBjb2RlYnVpbGQuQnVpbGRTcGVjLmZyb21PYmplY3Qoe1xuICAgICAgICB2ZXJzaW9uOiAnMC4yJyxcbiAgICAgICAgcm9sZTogcHJvcHMuc2VydmljZVJvbGUsXG4gICAgICAgIHBoYXNlczoge1xuICAgICAgICAgIGluc3RhbGw6IHtcbiAgICAgICAgICAgIGNvbW1hbmRzOiBbXG4gICAgICAgICAgICAgICdjZCBzaXRlLWNvbnRlbnRzJyxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICBidWlsZDoge1xuICAgICAgICAgICAgY29tbWFuZHM6ICdlY2hvIFwiTm90aGluZyB0byBkbyBoZXJlLi4uXCInLCAvLyBUT0RPOiBleGFtcGxpZnkgc2l0ZSBidWlsZGluZ1xuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIGFydGlmYWN0czoge1xuICAgICAgICAgICdiYXNlLWRpcmVjdG9yeSc6ICdzaXRlLWNvbnRlbnRzJyxcbiAgICAgICAgICBmaWxlczogW1xuICAgICAgICAgICAgJ2luZGV4Lmh0bWwnLFxuICAgICAgICAgICAgJ2Vycm9yLmh0bWwnLFxuICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICB9KSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIGJ1aWxkSW1hZ2U6IGNvZGVidWlsZC5MaW51eEJ1aWxkSW1hZ2UuVUJVTlRVXzE0XzA0X05PREVKU18xMF8xNF8xLFxuICAgICAgfSxcbiAgICB9KTtcbiAgICBjb25zdCBzaXRlQnVpbGRPdXRwdXQgPSBuZXcgY29kZXBpcGVsaW5lLkFydGlmYWN0KCdTaXRlQnVpbGRPdXRwdXQnKTtcbiAgICBjb25zdCBzaXRlQnVpbGRBY3Rpb24gPSBuZXcgY29kZXBpcGVsaW5lX2FjdGlvbnMuQ29kZUJ1aWxkQWN0aW9uKHtcbiAgICAgIGFjdGlvbk5hbWU6ICdTaXRlX0J1aWxkJyxcbiAgICAgIHByb2plY3Q6IFNpdGVCdWlsZCxcbiAgICAgIGlucHV0OiBzb3VyY2VPdXRwdXQsXG4gICAgICBvdXRwdXRzOiBbc2l0ZUJ1aWxkT3V0cHV0XSxcbiAgICB9KTtcblxuICAgIGNvbnN0IGRlcGxveUFjdGlvbiA9IG5ldyBjb2RlcGlwZWxpbmVfYWN0aW9ucy5DbG91ZEZvcm1hdGlvbkNyZWF0ZVVwZGF0ZVN0YWNrQWN0aW9uKHtcbiAgICAgIGFjdGlvbk5hbWU6ICdTaXRlX0NGTl9EZXBsb3knLFxuICAgICAgdGVtcGxhdGVQYXRoOiBjZGtCdWlsZE91dHB1dC5hdFBhdGgocHJvcHMuY2ZuVGVtcGxhdGUpLFxuICAgICAgc3RhY2tOYW1lOiAnU2l0ZURlcGxveW1lbnRTdGFjaycsXG4gICAgICBhZG1pblBlcm1pc3Npb25zOiB0cnVlLFxuICAgICAgZXh0cmFJbnB1dHM6IFtzaXRlQnVpbGRPdXRwdXRdLFxuICAgIH0pO1xuXG4gICAgbmV3IGNvZGVwaXBlbGluZS5QaXBlbGluZSh0aGlzLCAnUGlwZWxpbmUnLCB7XG4gICAgICBzdGFnZXM6IFtcbiAgICAgICAge1xuICAgICAgICAgIHN0YWdlTmFtZTogJ1NvdXJjZScsXG4gICAgICAgICAgYWN0aW9uczogWyBzb3VyY2VBY3Rpb24gXSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHN0YWdlTmFtZTogJ0J1aWxkJyxcbiAgICAgICAgICBhY3Rpb25zOiBbXG4gICAgICAgICAgICBjZGtCdWlsZEFjdGlvbixcbiAgICAgICAgICAgIHNpdGVCdWlsZEFjdGlvblxuICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBzdGFnZU5hbWU6ICdEZXBsb3knLFxuICAgICAgICAgIGFjdGlvbnM6IFsgZGVwbG95QWN0aW9uIF0sXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH0pO1xuICB9XG59XG5cbiJdfQ==