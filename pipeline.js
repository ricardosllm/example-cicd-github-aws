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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGlwZWxpbmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJwaXBlbGluZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSxxQ0FBc0M7QUFDdEMsb0RBQXFEO0FBQ3JELDBEQUEyRDtBQUMzRCwwRUFBMkU7QUFDM0Usd0NBQTBDO0FBUTFDLE1BQWEsUUFBUyxTQUFRLGdCQUFTO0lBQ3JDLFlBQVksTUFBaUIsRUFBRSxJQUFZLEVBQUUsS0FBb0I7UUFDL0QsS0FBSyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztRQUVwQixNQUFNLFlBQVksR0FBRyxJQUFJLFlBQVksQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUNqRCxNQUFNLFlBQVksR0FBRyxJQUFJLG9CQUFvQixDQUFDLGtCQUFrQixDQUFDO1lBQy9ELFVBQVUsRUFBRSxlQUFlO1lBQzNCLEtBQUssRUFBRSxhQUFhO1lBQ3BCLElBQUksRUFBRSx5QkFBeUI7WUFDL0IsVUFBVSxFQUFFLEdBQUcsQ0FBQyxXQUFXLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUM7WUFDN0QsTUFBTSxFQUFFLFlBQVk7WUFDcEIsTUFBTSxFQUFFLFFBQVE7WUFDaEIsb0VBQW9FO1lBQ3BFLE9BQU8sRUFBRSxvQkFBb0IsQ0FBQyxhQUFhLENBQUMsT0FBTztTQUNwRCxDQUFDLENBQUM7UUFFSCxNQUFNLFFBQVEsR0FBRyxJQUFJLFNBQVMsQ0FBQyxlQUFlLENBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRTtZQUMvRCxTQUFTLEVBQUUsU0FBUyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUM7Z0JBQ3hDLE9BQU8sRUFBRSxLQUFLO2dCQUNkLE1BQU0sRUFBRTtvQkFDTixPQUFPLEVBQUU7d0JBQ1AsUUFBUSxFQUFFLGFBQWE7cUJBQ3hCO29CQUNELEtBQUssRUFBRTt3QkFDTCxRQUFRLEVBQUU7NEJBQ1IsS0FBSzs0QkFDTCxlQUFlOzRCQUNmLCtCQUErQjt5QkFDaEM7cUJBQ0Y7aUJBQ0Y7Z0JBQ0QsU0FBUyxFQUFFO29CQUNULGdCQUFnQixFQUFFLFNBQVM7b0JBQzNCLEtBQUssRUFBRTt3QkFDTCxLQUFLLENBQUMsV0FBVztxQkFDbEI7aUJBQ0Y7YUFDRixDQUFDO1lBQ0YsV0FBVyxFQUFFO2dCQUNYLFVBQVUsRUFBRSxTQUFTLENBQUMsZUFBZSxDQUFDLDJCQUEyQjthQUNsRTtTQUNGLENBQUMsQ0FBQztRQUNILE1BQU0sY0FBYyxHQUFHLElBQUksWUFBWSxDQUFDLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBQ25FLE1BQU0sY0FBYyxHQUFHLElBQUksb0JBQW9CLENBQUMsZUFBZSxDQUFDO1lBQzlELFVBQVUsRUFBRSxXQUFXO1lBQ3ZCLE9BQU8sRUFBRSxRQUFRO1lBQ2pCLEtBQUssRUFBRSxZQUFZO1lBQ25CLE9BQU8sRUFBRSxDQUFDLGNBQWMsQ0FBQztTQUMxQixDQUFDLENBQUM7UUFFSCxnRkFBZ0Y7UUFDaEYsTUFBTSxTQUFTLEdBQUcsSUFBSSxTQUFTLENBQUMsZUFBZSxDQUFDLElBQUksRUFBRSxXQUFXLEVBQUU7WUFDakUsU0FBUyxFQUFFLFNBQVMsQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDO2dCQUN4QyxPQUFPLEVBQUUsS0FBSztnQkFDZCxNQUFNLEVBQUU7b0JBQ04sT0FBTyxFQUFFO3dCQUNQLFFBQVEsRUFBRTs0QkFDUixrQkFBa0I7eUJBQ25CO3FCQUNGO29CQUNELEtBQUssRUFBRTt3QkFDTCxRQUFRLEVBQUUsOEJBQThCO3FCQUN6QztpQkFDRjtnQkFDRCxTQUFTLEVBQUU7b0JBQ1QsZ0JBQWdCLEVBQUUsZUFBZTtvQkFDakMsS0FBSyxFQUFFO3dCQUNMLFlBQVk7d0JBQ1osWUFBWTtxQkFDYjtpQkFDRjthQUNGLENBQUM7WUFDRixXQUFXLEVBQUU7Z0JBQ1gsVUFBVSxFQUFFLFNBQVMsQ0FBQyxlQUFlLENBQUMsMkJBQTJCO2FBQ2xFO1NBQ0YsQ0FBQyxDQUFDO1FBQ0gsTUFBTSxlQUFlLEdBQUcsSUFBSSxZQUFZLENBQUMsUUFBUSxDQUFDLGlCQUFpQixDQUFDLENBQUM7UUFDckUsTUFBTSxlQUFlLEdBQUcsSUFBSSxvQkFBb0IsQ0FBQyxlQUFlLENBQUM7WUFDL0QsVUFBVSxFQUFFLFlBQVk7WUFDeEIsT0FBTyxFQUFFLFNBQVM7WUFDbEIsS0FBSyxFQUFFLFlBQVk7WUFDbkIsT0FBTyxFQUFFLENBQUMsZUFBZSxDQUFDO1NBQzNCLENBQUMsQ0FBQztRQUVILE1BQU0sWUFBWSxHQUFHLElBQUksb0JBQW9CLENBQUMscUNBQXFDLENBQUM7WUFDbEYsVUFBVSxFQUFFLGlCQUFpQjtZQUM3QixZQUFZLEVBQUUsY0FBYyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDO1lBQ3RELFNBQVMsRUFBRSxxQkFBcUI7WUFDaEMsZ0JBQWdCLEVBQUUsSUFBSTtZQUN0QixXQUFXLEVBQUUsQ0FBQyxlQUFlLENBQUM7U0FDL0IsQ0FBQyxDQUFDO1FBRUgsSUFBSSxZQUFZLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxVQUFVLEVBQUU7WUFDMUMsTUFBTSxFQUFFO2dCQUNOO29CQUNFLFNBQVMsRUFBRSxRQUFRO29CQUNuQixPQUFPLEVBQUUsQ0FBRSxZQUFZLENBQUU7aUJBQzFCO2dCQUNEO29CQUNFLFNBQVMsRUFBRSxPQUFPO29CQUNsQixPQUFPLEVBQUU7d0JBQ1AsY0FBYzt3QkFDZCxlQUFlO3FCQUNoQjtpQkFDRjtnQkFDRDtvQkFDRSxTQUFTLEVBQUUsUUFBUTtvQkFDbkIsT0FBTyxFQUFFLENBQUUsWUFBWSxDQUFFO2lCQUMxQjthQUNGO1NBQ0YsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBaEhELDRCQWdIQyIsInNvdXJjZXNDb250ZW50IjpbIiMhL3Vzci9iaW4vZW52IG5vZGVcbmltcG9ydCBjZGsgPSByZXF1aXJlKCdAYXdzLWNkay9jb3JlJyk7XG5pbXBvcnQgY29kZWJ1aWxkID0gcmVxdWlyZSgnQGF3cy1jZGsvYXdzLWNvZGVidWlsZCcpO1xuaW1wb3J0IGNvZGVwaXBlbGluZSA9IHJlcXVpcmUoJ0Bhd3MtY2RrL2F3cy1jb2RlcGlwZWxpbmUnKTtcbmltcG9ydCBjb2RlcGlwZWxpbmVfYWN0aW9ucyA9IHJlcXVpcmUoJ0Bhd3MtY2RrL2F3cy1jb2RlcGlwZWxpbmUtYWN0aW9ucycpO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnQGF3cy1jZGsvY29yZSc7XG4vLyBpbXBvcnQgeyBBcHAsIFN0YWNrLCBTdGFja1Byb3BzIH0gZnJvbSAnQGF3cy1jZGsvY29yZSc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgUGlwZWxpbmVQcm9wcyB7XG4gIHNvdXJjZVRva2VuOiBzdHJpbmc7XG4gIGNmblRlbXBsYXRlOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjbGFzcyBQaXBlbGluZSBleHRlbmRzIENvbnN0cnVjdCB7XG4gIGNvbnN0cnVjdG9yKHBhcmVudDogQ29uc3RydWN0LCBuYW1lOiBzdHJpbmcsIHByb3BzOiBQaXBlbGluZVByb3BzKSB7XG4gICAgc3VwZXIocGFyZW50LCBuYW1lKTtcblxuICAgIGNvbnN0IHNvdXJjZU91dHB1dCA9IG5ldyBjb2RlcGlwZWxpbmUuQXJ0aWZhY3QoKTtcbiAgICBjb25zdCBzb3VyY2VBY3Rpb24gPSBuZXcgY29kZXBpcGVsaW5lX2FjdGlvbnMuR2l0SHViU291cmNlQWN0aW9uKHtcbiAgICAgIGFjdGlvbk5hbWU6ICdHaXRIdWJfU291cmNlJyxcbiAgICAgIG93bmVyOiAncmljYXJkb3NsbG0nLFxuICAgICAgcmVwbzogJ2V4YW1wbGUtY2ljZC1naXRodWItYXdzJyxcbiAgICAgIG9hdXRoVG9rZW46IGNkay5TZWNyZXRWYWx1ZS5zZWNyZXRzTWFuYWdlcihwcm9wcy5zb3VyY2VUb2tlbiksXG4gICAgICBvdXRwdXQ6IHNvdXJjZU91dHB1dCxcbiAgICAgIGJyYW5jaDogJ21hc3RlcicsXG4gICAgICAvLyBkZWZhdWx0OiAnV0VCSE9PSycsICdOT05FJyBpcyBhbHNvIHBvc3NpYmxlIGZvciBubyBTb3VyY2UgdHJpZ2dlclxuICAgICAgdHJpZ2dlcjogY29kZXBpcGVsaW5lX2FjdGlvbnMuR2l0SHViVHJpZ2dlci5XRUJIT09LXG4gICAgfSk7XG5cbiAgICBjb25zdCBjZGtCdWlsZCA9IG5ldyBjb2RlYnVpbGQuUGlwZWxpbmVQcm9qZWN0KHRoaXMsICdDZGtCdWlsZCcsIHtcbiAgICAgIGJ1aWxkU3BlYzogY29kZWJ1aWxkLkJ1aWxkU3BlYy5mcm9tT2JqZWN0KHtcbiAgICAgICAgdmVyc2lvbjogJzAuMicsXG4gICAgICAgIHBoYXNlczoge1xuICAgICAgICAgIGluc3RhbGw6IHtcbiAgICAgICAgICAgIGNvbW1hbmRzOiAnbnBtIGluc3RhbGwnLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgYnVpbGQ6IHtcbiAgICAgICAgICAgIGNvbW1hbmRzOiBbXG4gICAgICAgICAgICAgICdlbnYnLCAvLyBUT0RPOiByZW1vdmUgYWZ0ZXIgZGVidWdnaW5nXG4gICAgICAgICAgICAgICducG0gcnVuIGJ1aWxkJyxcbiAgICAgICAgICAgICAgJy4vbm9kZV9tb2R1bGVzLy5iaW4vY2RrIHN5bnRoJ1xuICAgICAgICAgICAgXSxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBhcnRpZmFjdHM6IHtcbiAgICAgICAgICAnYmFzZS1kaXJlY3RvcnknOiAnY2RrLm91dCcsXG4gICAgICAgICAgZmlsZXM6IFtcbiAgICAgICAgICAgIHByb3BzLmNmblRlbXBsYXRlLFxuICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICB9KSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIGJ1aWxkSW1hZ2U6IGNvZGVidWlsZC5MaW51eEJ1aWxkSW1hZ2UuVUJVTlRVXzE0XzA0X05PREVKU18xMF8xNF8xLFxuICAgICAgfSxcbiAgICB9KTtcbiAgICBjb25zdCBjZGtCdWlsZE91dHB1dCA9IG5ldyBjb2RlcGlwZWxpbmUuQXJ0aWZhY3QoJ0Nka0J1aWxkT3V0cHV0Jyk7XG4gICAgY29uc3QgY2RrQnVpbGRBY3Rpb24gPSBuZXcgY29kZXBpcGVsaW5lX2FjdGlvbnMuQ29kZUJ1aWxkQWN0aW9uKHtcbiAgICAgIGFjdGlvbk5hbWU6ICdDREtfQnVpbGQnLFxuICAgICAgcHJvamVjdDogY2RrQnVpbGQsXG4gICAgICBpbnB1dDogc291cmNlT3V0cHV0LFxuICAgICAgb3V0cHV0czogW2Nka0J1aWxkT3V0cHV0XSxcbiAgICB9KTtcblxuICAgIC8vIE5vdCBkb2luZyBhbnl0aGluZyBhdG0gYXMgdGhlcmUncyBub3RoaW5nIHRvIGJ1aWxkIGZyb20gdGhlIHN0YXRpYyBzaXRlLiBUT0RPXG4gICAgY29uc3QgU2l0ZUJ1aWxkID0gbmV3IGNvZGVidWlsZC5QaXBlbGluZVByb2plY3QodGhpcywgJ1NpdGVCdWlsZCcsIHtcbiAgICAgIGJ1aWxkU3BlYzogY29kZWJ1aWxkLkJ1aWxkU3BlYy5mcm9tT2JqZWN0KHtcbiAgICAgICAgdmVyc2lvbjogJzAuMicsXG4gICAgICAgIHBoYXNlczoge1xuICAgICAgICAgIGluc3RhbGw6IHtcbiAgICAgICAgICAgIGNvbW1hbmRzOiBbXG4gICAgICAgICAgICAgICdjZCBzaXRlLWNvbnRlbnRzJyxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICBidWlsZDoge1xuICAgICAgICAgICAgY29tbWFuZHM6ICdlY2hvIFwiTm90aGluZyB0byBkbyBoZXJlLi4uXCInLCAvLyBUT0RPOiBleGFtcGxpZnkgc2l0ZSBidWlsZGluZ1xuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIGFydGlmYWN0czoge1xuICAgICAgICAgICdiYXNlLWRpcmVjdG9yeSc6ICdzaXRlLWNvbnRlbnRzJyxcbiAgICAgICAgICBmaWxlczogW1xuICAgICAgICAgICAgJ2luZGV4Lmh0bWwnLFxuICAgICAgICAgICAgJ2Vycm9yLmh0bWwnLFxuICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICB9KSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIGJ1aWxkSW1hZ2U6IGNvZGVidWlsZC5MaW51eEJ1aWxkSW1hZ2UuVUJVTlRVXzE0XzA0X05PREVKU18xMF8xNF8xLFxuICAgICAgfSxcbiAgICB9KTtcbiAgICBjb25zdCBzaXRlQnVpbGRPdXRwdXQgPSBuZXcgY29kZXBpcGVsaW5lLkFydGlmYWN0KCdTaXRlQnVpbGRPdXRwdXQnKTtcbiAgICBjb25zdCBzaXRlQnVpbGRBY3Rpb24gPSBuZXcgY29kZXBpcGVsaW5lX2FjdGlvbnMuQ29kZUJ1aWxkQWN0aW9uKHtcbiAgICAgIGFjdGlvbk5hbWU6ICdTaXRlX0J1aWxkJyxcbiAgICAgIHByb2plY3Q6IFNpdGVCdWlsZCxcbiAgICAgIGlucHV0OiBzb3VyY2VPdXRwdXQsXG4gICAgICBvdXRwdXRzOiBbc2l0ZUJ1aWxkT3V0cHV0XSxcbiAgICB9KTtcblxuICAgIGNvbnN0IGRlcGxveUFjdGlvbiA9IG5ldyBjb2RlcGlwZWxpbmVfYWN0aW9ucy5DbG91ZEZvcm1hdGlvbkNyZWF0ZVVwZGF0ZVN0YWNrQWN0aW9uKHtcbiAgICAgIGFjdGlvbk5hbWU6ICdTaXRlX0NGTl9EZXBsb3knLFxuICAgICAgdGVtcGxhdGVQYXRoOiBjZGtCdWlsZE91dHB1dC5hdFBhdGgocHJvcHMuY2ZuVGVtcGxhdGUpLFxuICAgICAgc3RhY2tOYW1lOiAnU2l0ZURlcGxveW1lbnRTdGFjaycsXG4gICAgICBhZG1pblBlcm1pc3Npb25zOiB0cnVlLFxuICAgICAgZXh0cmFJbnB1dHM6IFtzaXRlQnVpbGRPdXRwdXRdLFxuICAgIH0pO1xuXG4gICAgbmV3IGNvZGVwaXBlbGluZS5QaXBlbGluZSh0aGlzLCAnUGlwZWxpbmUnLCB7XG4gICAgICBzdGFnZXM6IFtcbiAgICAgICAge1xuICAgICAgICAgIHN0YWdlTmFtZTogJ1NvdXJjZScsXG4gICAgICAgICAgYWN0aW9uczogWyBzb3VyY2VBY3Rpb24gXSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHN0YWdlTmFtZTogJ0J1aWxkJyxcbiAgICAgICAgICBhY3Rpb25zOiBbXG4gICAgICAgICAgICBjZGtCdWlsZEFjdGlvbixcbiAgICAgICAgICAgIHNpdGVCdWlsZEFjdGlvblxuICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBzdGFnZU5hbWU6ICdEZXBsb3knLFxuICAgICAgICAgIGFjdGlvbnM6IFsgZGVwbG95QWN0aW9uIF0sXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH0pO1xuICB9XG59XG5cbiJdfQ==