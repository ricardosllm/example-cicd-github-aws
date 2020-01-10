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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGlwZWxpbmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJwaXBlbGluZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSxxQ0FBc0M7QUFDdEMsb0RBQXFEO0FBQ3JELDBEQUEyRDtBQUMzRCwwRUFBMkU7QUFDM0Usd0NBQTBDO0FBUTFDLE1BQWEsUUFBUyxTQUFRLGdCQUFTO0lBQ3JDLFlBQVksTUFBaUIsRUFBRSxJQUFZLEVBQUUsS0FBb0I7UUFDL0QsS0FBSyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztRQUVwQixNQUFNLFlBQVksR0FBRyxJQUFJLFlBQVksQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUNqRCxNQUFNLFlBQVksR0FBRyxJQUFJLG9CQUFvQixDQUFDLGtCQUFrQixDQUFDO1lBQy9ELFVBQVUsRUFBRSxlQUFlO1lBQzNCLEtBQUssRUFBRSxhQUFhO1lBQ3BCLElBQUksRUFBRSx5QkFBeUI7WUFDL0IsVUFBVSxFQUFFLEdBQUcsQ0FBQyxXQUFXLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUM7WUFDN0QsTUFBTSxFQUFFLFlBQVk7WUFDcEIsTUFBTSxFQUFFLFFBQVE7WUFDaEIsb0VBQW9FO1lBQ3BFLE9BQU8sRUFBRSxvQkFBb0IsQ0FBQyxhQUFhLENBQUMsT0FBTztTQUNwRCxDQUFDLENBQUM7UUFFSCxNQUFNLFFBQVEsR0FBRyxJQUFJLFNBQVMsQ0FBQyxlQUFlLENBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRTtZQUMvRCxTQUFTLEVBQUUsU0FBUyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUM7Z0JBQ3hDLE9BQU8sRUFBRSxLQUFLO2dCQUNkLE1BQU0sRUFBRTtvQkFDTixPQUFPLEVBQUU7d0JBQ1AsUUFBUSxFQUFFLGFBQWE7cUJBQ3hCO29CQUNELEtBQUssRUFBRTt3QkFDTCxRQUFRLEVBQUU7NEJBQ1IsZUFBZTs0QkFDZixXQUFXO3lCQUNaO3FCQUNGO2lCQUNGO2dCQUNELFNBQVMsRUFBRTtvQkFDVCxnQkFBZ0IsRUFBRSxTQUFTO29CQUMzQixLQUFLLEVBQUU7d0JBQ0wsS0FBSyxDQUFDLFdBQVc7cUJBQ2xCO2lCQUNGO2FBQ0YsQ0FBQztZQUNGLFdBQVcsRUFBRTtnQkFDWCxVQUFVLEVBQUUsU0FBUyxDQUFDLGVBQWUsQ0FBQywyQkFBMkI7YUFDbEU7U0FDRixDQUFDLENBQUM7UUFDSCxNQUFNLGNBQWMsR0FBRyxJQUFJLFlBQVksQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztRQUNuRSxNQUFNLGNBQWMsR0FBRyxJQUFJLG9CQUFvQixDQUFDLGVBQWUsQ0FBQztZQUM5RCxVQUFVLEVBQUUsV0FBVztZQUN2QixPQUFPLEVBQUUsUUFBUTtZQUNqQixLQUFLLEVBQUUsWUFBWTtZQUNuQixPQUFPLEVBQUUsQ0FBQyxjQUFjLENBQUM7U0FDMUIsQ0FBQyxDQUFDO1FBRUgsZ0ZBQWdGO1FBQ2hGLE1BQU0sU0FBUyxHQUFHLElBQUksU0FBUyxDQUFDLGVBQWUsQ0FBQyxJQUFJLEVBQUUsV0FBVyxFQUFFO1lBQ2pFLFNBQVMsRUFBRSxTQUFTLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQztnQkFDeEMsT0FBTyxFQUFFLEtBQUs7Z0JBQ2QsTUFBTSxFQUFFO29CQUNOLE9BQU8sRUFBRTt3QkFDUCxRQUFRLEVBQUU7NEJBQ1Isa0JBQWtCO3lCQUNuQjtxQkFDRjtvQkFDRCxLQUFLLEVBQUU7d0JBQ0wsUUFBUSxFQUFFLDhCQUE4QjtxQkFDekM7aUJBQ0Y7Z0JBQ0QsU0FBUyxFQUFFO29CQUNULGdCQUFnQixFQUFFLGVBQWU7b0JBQ2pDLEtBQUssRUFBRTt3QkFDTCxZQUFZO3dCQUNaLFlBQVk7cUJBQ2I7aUJBQ0Y7YUFDRixDQUFDO1lBQ0YsV0FBVyxFQUFFO2dCQUNYLFVBQVUsRUFBRSxTQUFTLENBQUMsZUFBZSxDQUFDLDJCQUEyQjthQUNsRTtTQUNGLENBQUMsQ0FBQztRQUNILE1BQU0sZUFBZSxHQUFHLElBQUksWUFBWSxDQUFDLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1FBQ3JFLE1BQU0sZUFBZSxHQUFHLElBQUksb0JBQW9CLENBQUMsZUFBZSxDQUFDO1lBQy9ELFVBQVUsRUFBRSxZQUFZO1lBQ3hCLE9BQU8sRUFBRSxTQUFTO1lBQ2xCLEtBQUssRUFBRSxZQUFZO1lBQ25CLE9BQU8sRUFBRSxDQUFDLGVBQWUsQ0FBQztTQUMzQixDQUFDLENBQUM7UUFFSCxNQUFNLFlBQVksR0FBRyxJQUFJLG9CQUFvQixDQUFDLHFDQUFxQyxDQUFDO1lBQ2xGLFVBQVUsRUFBRSxpQkFBaUI7WUFDN0IsWUFBWSxFQUFFLGNBQWMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQztZQUN0RCxTQUFTLEVBQUUscUJBQXFCO1lBQ2hDLGdCQUFnQixFQUFFLElBQUk7WUFDdEIsV0FBVyxFQUFFLENBQUMsZUFBZSxDQUFDO1NBQy9CLENBQUMsQ0FBQztRQUVILElBQUksWUFBWSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsVUFBVSxFQUFFO1lBQzFDLE1BQU0sRUFBRTtnQkFDTjtvQkFDRSxTQUFTLEVBQUUsUUFBUTtvQkFDbkIsT0FBTyxFQUFFLENBQUUsWUFBWSxDQUFFO2lCQUMxQjtnQkFDRDtvQkFDRSxTQUFTLEVBQUUsT0FBTztvQkFDbEIsT0FBTyxFQUFFO3dCQUNQLGNBQWM7d0JBQ2QsZUFBZTtxQkFDaEI7aUJBQ0Y7Z0JBQ0Q7b0JBQ0UsU0FBUyxFQUFFLFFBQVE7b0JBQ25CLE9BQU8sRUFBRSxDQUFFLFlBQVksQ0FBRTtpQkFDMUI7YUFDRjtTQUNGLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQS9HRCw0QkErR0MiLCJzb3VyY2VzQ29udGVudCI6WyIjIS91c3IvYmluL2VudiBub2RlXG5pbXBvcnQgY2RrID0gcmVxdWlyZSgnQGF3cy1jZGsvY29yZScpO1xuaW1wb3J0IGNvZGVidWlsZCA9IHJlcXVpcmUoJ0Bhd3MtY2RrL2F3cy1jb2RlYnVpbGQnKTtcbmltcG9ydCBjb2RlcGlwZWxpbmUgPSByZXF1aXJlKCdAYXdzLWNkay9hd3MtY29kZXBpcGVsaW5lJyk7XG5pbXBvcnQgY29kZXBpcGVsaW5lX2FjdGlvbnMgPSByZXF1aXJlKCdAYXdzLWNkay9hd3MtY29kZXBpcGVsaW5lLWFjdGlvbnMnKTtcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ0Bhd3MtY2RrL2NvcmUnO1xuLy8gaW1wb3J0IHsgQXBwLCBTdGFjaywgU3RhY2tQcm9wcyB9IGZyb20gJ0Bhd3MtY2RrL2NvcmUnO1xuXG5leHBvcnQgaW50ZXJmYWNlIFBpcGVsaW5lUHJvcHMge1xuICBzb3VyY2VUb2tlbjogc3RyaW5nO1xuICBjZm5UZW1wbGF0ZTogc3RyaW5nO1xufVxuXG5leHBvcnQgY2xhc3MgUGlwZWxpbmUgZXh0ZW5kcyBDb25zdHJ1Y3Qge1xuICBjb25zdHJ1Y3RvcihwYXJlbnQ6IENvbnN0cnVjdCwgbmFtZTogc3RyaW5nLCBwcm9wczogUGlwZWxpbmVQcm9wcykge1xuICAgIHN1cGVyKHBhcmVudCwgbmFtZSk7XG5cbiAgICBjb25zdCBzb3VyY2VPdXRwdXQgPSBuZXcgY29kZXBpcGVsaW5lLkFydGlmYWN0KCk7XG4gICAgY29uc3Qgc291cmNlQWN0aW9uID0gbmV3IGNvZGVwaXBlbGluZV9hY3Rpb25zLkdpdEh1YlNvdXJjZUFjdGlvbih7XG4gICAgICBhY3Rpb25OYW1lOiAnR2l0SHViX1NvdXJjZScsXG4gICAgICBvd25lcjogJ3JpY2FyZG9zbGxtJyxcbiAgICAgIHJlcG86ICdleGFtcGxlLWNpY2QtZ2l0aHViLWF3cycsXG4gICAgICBvYXV0aFRva2VuOiBjZGsuU2VjcmV0VmFsdWUuc2VjcmV0c01hbmFnZXIocHJvcHMuc291cmNlVG9rZW4pLFxuICAgICAgb3V0cHV0OiBzb3VyY2VPdXRwdXQsXG4gICAgICBicmFuY2g6ICdtYXN0ZXInLFxuICAgICAgLy8gZGVmYXVsdDogJ1dFQkhPT0snLCAnTk9ORScgaXMgYWxzbyBwb3NzaWJsZSBmb3Igbm8gU291cmNlIHRyaWdnZXJcbiAgICAgIHRyaWdnZXI6IGNvZGVwaXBlbGluZV9hY3Rpb25zLkdpdEh1YlRyaWdnZXIuV0VCSE9PS1xuICAgIH0pO1xuXG4gICAgY29uc3QgY2RrQnVpbGQgPSBuZXcgY29kZWJ1aWxkLlBpcGVsaW5lUHJvamVjdCh0aGlzLCAnQ2RrQnVpbGQnLCB7XG4gICAgICBidWlsZFNwZWM6IGNvZGVidWlsZC5CdWlsZFNwZWMuZnJvbU9iamVjdCh7XG4gICAgICAgIHZlcnNpb246ICcwLjInLFxuICAgICAgICBwaGFzZXM6IHtcbiAgICAgICAgICBpbnN0YWxsOiB7XG4gICAgICAgICAgICBjb21tYW5kczogJ25wbSBpbnN0YWxsJyxcbiAgICAgICAgICB9LFxuICAgICAgICAgIGJ1aWxkOiB7XG4gICAgICAgICAgICBjb21tYW5kczogW1xuICAgICAgICAgICAgICAnbnBtIHJ1biBidWlsZCcsXG4gICAgICAgICAgICAgICdjZGsgc3ludGgnXG4gICAgICAgICAgICBdLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIGFydGlmYWN0czoge1xuICAgICAgICAgICdiYXNlLWRpcmVjdG9yeSc6ICdjZGsub3V0JyxcbiAgICAgICAgICBmaWxlczogW1xuICAgICAgICAgICAgcHJvcHMuY2ZuVGVtcGxhdGUsXG4gICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgIH0pLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgYnVpbGRJbWFnZTogY29kZWJ1aWxkLkxpbnV4QnVpbGRJbWFnZS5VQlVOVFVfMTRfMDRfTk9ERUpTXzEwXzE0XzEsXG4gICAgICB9LFxuICAgIH0pO1xuICAgIGNvbnN0IGNka0J1aWxkT3V0cHV0ID0gbmV3IGNvZGVwaXBlbGluZS5BcnRpZmFjdCgnQ2RrQnVpbGRPdXRwdXQnKTtcbiAgICBjb25zdCBjZGtCdWlsZEFjdGlvbiA9IG5ldyBjb2RlcGlwZWxpbmVfYWN0aW9ucy5Db2RlQnVpbGRBY3Rpb24oe1xuICAgICAgYWN0aW9uTmFtZTogJ0NES19CdWlsZCcsXG4gICAgICBwcm9qZWN0OiBjZGtCdWlsZCxcbiAgICAgIGlucHV0OiBzb3VyY2VPdXRwdXQsXG4gICAgICBvdXRwdXRzOiBbY2RrQnVpbGRPdXRwdXRdLFxuICAgIH0pO1xuXG4gICAgLy8gTm90IGRvaW5nIGFueXRoaW5nIGF0bSBhcyB0aGVyZSdzIG5vdGhpbmcgdG8gYnVpbGQgZnJvbSB0aGUgc3RhdGljIHNpdGUuIFRPRE9cbiAgICBjb25zdCBTaXRlQnVpbGQgPSBuZXcgY29kZWJ1aWxkLlBpcGVsaW5lUHJvamVjdCh0aGlzLCAnU2l0ZUJ1aWxkJywge1xuICAgICAgYnVpbGRTcGVjOiBjb2RlYnVpbGQuQnVpbGRTcGVjLmZyb21PYmplY3Qoe1xuICAgICAgICB2ZXJzaW9uOiAnMC4yJyxcbiAgICAgICAgcGhhc2VzOiB7XG4gICAgICAgICAgaW5zdGFsbDoge1xuICAgICAgICAgICAgY29tbWFuZHM6IFtcbiAgICAgICAgICAgICAgJ2NkIHNpdGUtY29udGVudHMnLFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIGJ1aWxkOiB7XG4gICAgICAgICAgICBjb21tYW5kczogJ2VjaG8gXCJOb3RoaW5nIHRvIGRvIGhlcmUuLi5cIicsIC8vIFRPRE86IGV4YW1wbGlmeSBzaXRlIGJ1aWxkaW5nXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgYXJ0aWZhY3RzOiB7XG4gICAgICAgICAgJ2Jhc2UtZGlyZWN0b3J5JzogJ3NpdGUtY29udGVudHMnLFxuICAgICAgICAgIGZpbGVzOiBbXG4gICAgICAgICAgICAnaW5kZXguaHRtbCcsXG4gICAgICAgICAgICAnZXJyb3IuaHRtbCcsXG4gICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgIH0pLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgYnVpbGRJbWFnZTogY29kZWJ1aWxkLkxpbnV4QnVpbGRJbWFnZS5VQlVOVFVfMTRfMDRfTk9ERUpTXzEwXzE0XzEsXG4gICAgICB9LFxuICAgIH0pO1xuICAgIGNvbnN0IHNpdGVCdWlsZE91dHB1dCA9IG5ldyBjb2RlcGlwZWxpbmUuQXJ0aWZhY3QoJ1NpdGVCdWlsZE91dHB1dCcpO1xuICAgIGNvbnN0IHNpdGVCdWlsZEFjdGlvbiA9IG5ldyBjb2RlcGlwZWxpbmVfYWN0aW9ucy5Db2RlQnVpbGRBY3Rpb24oe1xuICAgICAgYWN0aW9uTmFtZTogJ1NpdGVfQnVpbGQnLFxuICAgICAgcHJvamVjdDogU2l0ZUJ1aWxkLFxuICAgICAgaW5wdXQ6IHNvdXJjZU91dHB1dCxcbiAgICAgIG91dHB1dHM6IFtzaXRlQnVpbGRPdXRwdXRdLFxuICAgIH0pO1xuXG4gICAgY29uc3QgZGVwbG95QWN0aW9uID0gbmV3IGNvZGVwaXBlbGluZV9hY3Rpb25zLkNsb3VkRm9ybWF0aW9uQ3JlYXRlVXBkYXRlU3RhY2tBY3Rpb24oe1xuICAgICAgYWN0aW9uTmFtZTogJ1NpdGVfQ0ZOX0RlcGxveScsXG4gICAgICB0ZW1wbGF0ZVBhdGg6IGNka0J1aWxkT3V0cHV0LmF0UGF0aChwcm9wcy5jZm5UZW1wbGF0ZSksXG4gICAgICBzdGFja05hbWU6ICdTaXRlRGVwbG95bWVudFN0YWNrJyxcbiAgICAgIGFkbWluUGVybWlzc2lvbnM6IHRydWUsXG4gICAgICBleHRyYUlucHV0czogW3NpdGVCdWlsZE91dHB1dF0sXG4gICAgfSk7XG5cbiAgICBuZXcgY29kZXBpcGVsaW5lLlBpcGVsaW5lKHRoaXMsICdQaXBlbGluZScsIHtcbiAgICAgIHN0YWdlczogW1xuICAgICAgICB7XG4gICAgICAgICAgc3RhZ2VOYW1lOiAnU291cmNlJyxcbiAgICAgICAgICBhY3Rpb25zOiBbIHNvdXJjZUFjdGlvbiBdLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgc3RhZ2VOYW1lOiAnQnVpbGQnLFxuICAgICAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgICAgIGNka0J1aWxkQWN0aW9uLFxuICAgICAgICAgICAgc2l0ZUJ1aWxkQWN0aW9uXG4gICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHN0YWdlTmFtZTogJ0RlcGxveScsXG4gICAgICAgICAgYWN0aW9uczogWyBkZXBsb3lBY3Rpb24gXSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSk7XG4gIH1cbn1cblxuIl19