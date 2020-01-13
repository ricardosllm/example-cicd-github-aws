#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cdk = require("@aws-cdk/core");
const codebuild = require("@aws-cdk/aws-codebuild");
const codepipeline = require("@aws-cdk/aws-codepipeline");
const codepipeline_actions = require("@aws-cdk/aws-codepipeline-actions");
const iam = require("@aws-cdk/aws-iam");
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
        const cdkRole = iam.Role.fromRoleArn(this, 'cdkRole', props.serviceRole);
        const cdkBuild = new codebuild.PipelineProject(this, 'CdkBuild', {
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
                            './node_modules/.bin/cdk deploy MyStaticSite'
                        ],
                    },
                },
                artifacts: {
                    // 'base-directory': 'cdk.out',
                    'base-directory': 'dist',
                    files: [
                        // '*'
                        // props.cfnTemplate,
                        'MyStaticSite.template.json',
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
            templatePath: cdkBuildOutput.atPath('MyStaticSite.template.json'),
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGlwZWxpbmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJwaXBlbGluZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSxxQ0FBc0M7QUFDdEMsb0RBQXFEO0FBQ3JELDBEQUEyRDtBQUMzRCwwRUFBMkU7QUFDM0Usd0NBQXlDO0FBQ3pDLHdDQUEwQztBQVMxQyxNQUFhLFFBQVMsU0FBUSxnQkFBUztJQUNyQyxZQUFZLE1BQWlCLEVBQUUsSUFBWSxFQUFFLEtBQW9CO1FBQy9ELEtBQUssQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFFcEIsTUFBTSxZQUFZLEdBQUcsSUFBSSxZQUFZLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDakQsTUFBTSxZQUFZLEdBQUcsSUFBSSxvQkFBb0IsQ0FBQyxrQkFBa0IsQ0FBQztZQUMvRCxVQUFVLEVBQUUsZUFBZTtZQUMzQixLQUFLLEVBQUUsYUFBYTtZQUNwQixJQUFJLEVBQUUseUJBQXlCO1lBQy9CLFVBQVUsRUFBRSxHQUFHLENBQUMsV0FBVyxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDO1lBQzdELE1BQU0sRUFBRSxZQUFZO1lBQ3BCLE1BQU0sRUFBRSxRQUFRO1lBQ2hCLG9FQUFvRTtZQUNwRSxPQUFPLEVBQUUsb0JBQW9CLENBQUMsYUFBYSxDQUFDLE9BQU87U0FDcEQsQ0FBQyxDQUFDO1FBRUgsTUFBTSxPQUFPLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLFNBQVMsRUFBRSxLQUFLLENBQUMsV0FBVyxDQUFDLENBQUM7UUFFekUsTUFBTSxRQUFRLEdBQUcsSUFBSSxTQUFTLENBQUMsZUFBZSxDQUFDLElBQUksRUFBRSxVQUFVLEVBQUU7WUFDL0QsSUFBSSxFQUFFLE9BQU87WUFDYixTQUFTLEVBQUUsU0FBUyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUM7Z0JBQ3hDLE9BQU8sRUFBRSxLQUFLO2dCQUNkLE1BQU0sRUFBRTtvQkFD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bnYgbm9kZVxuaW1wb3J0IGNkayA9IHJlcXVpcmUoJ0Bhd3MtY2RrL2NvcmUnKTtcbmltcG9ydCBjb2RlYnVpbGQgPSByZXF1aXJlKCdAYXdzLWNkay9hd3MtY29kZWJ1aWxkJyk7XG5pbXBvcnQgY29kZXBpcGVsaW5lID0gcmVxdWlyZSgnQGF3cy1jZGsvYXdzLWNvZGVwaXBlbGluZScpO1xuaW1wb3J0IGNvZGVwaXBlbGluZV9hY3Rpb25zID0gcmVxdWlyZSgnQGF3cy1jZGsvYXdzLWNvZGVwaXBlbGluZS1hY3Rpb25zJyk7XG5pbXBvcnQgaWFtID0gcmVxdWlyZSgnQGF3cy1jZGsvYXdzLWlhbScpO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnQGF3cy1jZGsvY29yZSc7XG4vLyBpbXBvcnQgeyBBcHAsIFN0YWNrLCBTdGFja1Byb3BzIH0gZnJvbSAnQGF3cy1jZGsvY29yZSc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgUGlwZWxpbmVQcm9wcyB7XG4gIHNvdXJjZVRva2VuOiBzdHJpbmc7XG4gIGNmblRlbXBsYXRlOiBzdHJpbmc7XG4gIHNlcnZpY2VSb2xlOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjbGFzcyBQaXBlbGluZSBleHRlbmRzIENvbnN0cnVjdCB7XG4gIGNvbnN0cnVjdG9yKHBhcmVudDogQ29uc3RydWN0LCBuYW1lOiBzdHJpbmcsIHByb3BzOiBQaXBlbGluZVByb3BzKSB7XG4gICAgc3VwZXIocGFyZW50LCBuYW1lKTtcblxuICAgIGNvbnN0IHNvdXJjZU91dHB1dCA9IG5ldyBjb2RlcGlwZWxpbmUuQXJ0aWZhY3QoKTtcbiAgICBjb25zdCBzb3VyY2VBY3Rpb24gPSBuZXcgY29kZXBpcGVsaW5lX2FjdGlvbnMuR2l0SHViU291cmNlQWN0aW9uKHtcbiAgICAgIGFjdGlvbk5hbWU6ICdHaXRIdWJfU291cmNlJyxcbiAgICAgIG93bmVyOiAncmljYXJkb3NsbG0nLFxuICAgICAgcmVwbzogJ2V4YW1wbGUtY2ljZC1naXRodWItYXdzJyxcbiAgICAgIG9hdXRoVG9rZW46IGNkay5TZWNyZXRWYWx1ZS5zZWNyZXRzTWFuYWdlcihwcm9wcy5zb3VyY2VUb2tlbiksXG4gICAgICBvdXRwdXQ6IHNvdXJjZU91dHB1dCxcbiAgICAgIGJyYW5jaDogJ21hc3RlcicsXG4gICAgICAvLyBkZWZhdWx0OiAnV0VCSE9PSycsICdOT05FJyBpcyBhbHNvIHBvc3NpYmxlIGZvciBubyBTb3VyY2UgdHJpZ2dlclxuICAgICAgdHJpZ2dlcjogY29kZXBpcGVsaW5lX2FjdGlvbnMuR2l0SHViVHJpZ2dlci5XRUJIT09LXG4gICAgfSk7XG5cbiAgICBjb25zdCBjZGtSb2xlID0gaWFtLlJvbGUuZnJvbVJvbGVBcm4odGhpcywgJ2Nka1JvbGUnLCBwcm9wcy5zZXJ2aWNlUm9sZSk7XG5cbiAgICBjb25zdCBjZGtCdWlsZCA9IG5ldyBjb2RlYnVpbGQuUGlwZWxpbmVQcm9qZWN0KHRoaXMsICdDZGtCdWlsZCcsIHtcbiAgICAgIHJvbGU6IGNka1JvbGUsXG4gICAgICBidWlsZFNwZWM6IGNvZGVidWlsZC5CdWlsZFNwZWMuZnJvbU9iamVjdCh7XG4gICAgICAgIHZlcnNpb246ICcwLjInLFxuICAgICAgICBwaGFzZXM6IHtcbiAgICAgICAgICBpbnN0YWxsOiB7XG4gICAgICAgICAgICBjb21tYW5kczogJ25wbSBpbnN0YWxsJyxcbiAgICAgICAgICB9LFxuICAgICAgICAgIGJ1aWxkOiB7XG4gICAgICAgICAgICBjb21tYW5kczogW1xuICAgICAgICAgICAgICAnbnBtIHJ1biBidWlsZCcsXG4gICAgICAgICAgICAgICcuL25vZGVfbW9kdWxlcy8uYmluL2NkayBzeW50aCAtbyBkaXN0JyxcbiAgICAgICAgICAgICAgJy4vbm9kZV9tb2R1bGVzLy5iaW4vY2RrIGRlcGxveSBNeVN0YXRpY1NpdGUnXG4gICAgICAgICAgICBdLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIGFydGlmYWN0czoge1xuICAgICAgICAgIC8vICdiYXNlLWRpcmVjdG9yeSc6ICdjZGsub3V0JyxcbiAgICAgICAgICAnYmFzZS1kaXJlY3RvcnknOiAnZGlzdCcsXG4gICAgICAgICAgZmlsZXM6IFtcbiAgICAgICAgICAgIC8vICcqJ1xuICAgICAgICAgICAgLy8gcHJvcHMuY2ZuVGVtcGxhdGUsXG4gICAgICAgICAgICAnTXlTdGF0aWNTaXRlLnRlbXBsYXRlLmpzb24nLFxuICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICB9KSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIGJ1aWxkSW1hZ2U6IGNvZGVidWlsZC5MaW51eEJ1aWxkSW1hZ2UuVUJVTlRVXzE0XzA0X05PREVKU18xMF8xNF8xLFxuICAgICAgfSxcbiAgICB9KTtcbiAgICBjb25zdCBjZGtCdWlsZE91dHB1dCA9IG5ldyBjb2RlcGlwZWxpbmUuQXJ0aWZhY3QoJ0Nka0J1aWxkT3V0cHV0Jyk7XG4gICAgY29uc3QgY2RrQnVpbGRBY3Rpb24gPSBuZXcgY29kZXBpcGVsaW5lX2FjdGlvbnMuQ29kZUJ1aWxkQWN0aW9uKHtcbiAgICAgIGFjdGlvbk5hbWU6ICdDREtfQnVpbGQnLFxuICAgICAgcHJvamVjdDogY2RrQnVpbGQsXG4gICAgICBpbnB1dDogc291cmNlT3V0cHV0LFxuICAgICAgb3V0cHV0czogW2Nka0J1aWxkT3V0cHV0XSxcbiAgICB9KTtcblxuICAgIC8vIE5vdCBkb2luZyBhbnl0aGluZyBhdG0gYXMgdGhlcmUncyBub3RoaW5nIHRvIGJ1aWxkIGZyb20gdGhlIHN0YXRpYyBzaXRlLiBUT0RPXG4gICAgY29uc3QgU2l0ZUJ1aWxkID0gbmV3IGNvZGVidWlsZC5QaXBlbGluZVByb2plY3QodGhpcywgJ1NpdGVCdWlsZCcsIHtcbiAgICAgIGJ1aWxkU3BlYzogY29kZWJ1aWxkLkJ1aWxkU3BlYy5mcm9tT2JqZWN0KHtcbiAgICAgICAgdmVyc2lvbjogJzAuMicsXG4gICAgICAgIHBoYXNlczoge1xuICAgICAgICAgIGluc3RhbGw6IHtcbiAgICAgICAgICAgIGNvbW1hbmRzOiBbXG4gICAgICAgICAgICAgICdjZCBzaXRlLWNvbnRlbnRzJyxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICBidWlsZDoge1xuICAgICAgICAgICAgY29tbWFuZHM6ICdlY2hvIFwiTm90aGluZyB0byBkbyBoZXJlLi4uXCInLCAvLyBUT0RPOiBleGFtcGxpZnkgc2l0ZSBidWlsZGluZ1xuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIGFydGlmYWN0czoge1xuICAgICAgICAgICdiYXNlLWRpcmVjdG9yeSc6ICdzaXRlLWNvbnRlbnRzJyxcbiAgICAgICAgICBmaWxlczogW1xuICAgICAgICAgICAgJ2luZGV4Lmh0bWwnLFxuICAgICAgICAgICAgJ2Vycm9yLmh0bWwnLFxuICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICB9KSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIGJ1aWxkSW1hZ2U6IGNvZGVidWlsZC5MaW51eEJ1aWxkSW1hZ2UuVUJVTlRVXzE0XzA0X05PREVKU18xMF8xNF8xLFxuICAgICAgfSxcbiAgICB9KTtcbiAgICBjb25zdCBzaXRlQnVpbGRPdXRwdXQgPSBuZXcgY29kZXBpcGVsaW5lLkFydGlmYWN0KCdTaXRlQnVpbGRPdXRwdXQnKTtcbiAgICBjb25zdCBzaXRlQnVpbGRBY3Rpb24gPSBuZXcgY29kZXBpcGVsaW5lX2FjdGlvbnMuQ29kZUJ1aWxkQWN0aW9uKHtcbiAgICAgIGFjdGlvbk5hbWU6ICdTaXRlX0J1aWxkJyxcbiAgICAgIHByb2plY3Q6IFNpdGVCdWlsZCxcbiAgICAgIGlucHV0OiBzb3VyY2VPdXRwdXQsXG4gICAgICBvdXRwdXRzOiBbc2l0ZUJ1aWxkT3V0cHV0XSxcbiAgICB9KTtcblxuICAgIGNvbnN0IGRlcGxveUFjdGlvbiA9IG5ldyBjb2RlcGlwZWxpbmVfYWN0aW9ucy5DbG91ZEZvcm1hdGlvbkNyZWF0ZVVwZGF0ZVN0YWNrQWN0aW9uKHtcbiAgICAgIGFjdGlvbk5hbWU6ICdTaXRlX0NGTl9EZXBsb3knLFxuICAgICAgdGVtcGxhdGVQYXRoOiBjZGtCdWlsZE91dHB1dC5hdFBhdGgoJ015U3RhdGljU2l0ZS50ZW1wbGF0ZS5qc29uJyksXG4gICAgICBzdGFja05hbWU6ICdTaXRlRGVwbG95bWVudFN0YWNrJyxcbiAgICAgIGFkbWluUGVybWlzc2lvbnM6IHRydWUsXG4gICAgICBleHRyYUlucHV0czogW3NpdGVCdWlsZE91dHB1dF0sXG4gICAgfSk7XG5cbiAgICBuZXcgY29kZXBpcGVsaW5lLlBpcGVsaW5lKHRoaXMsICdQaXBlbGluZScsIHtcbiAgICAgIHN0YWdlczogW1xuICAgICAgICB7XG4gICAgICAgICAgc3RhZ2VOYW1lOiAnU291cmNlJyxcbiAgICAgICAgICBhY3Rpb25zOiBbIHNvdXJjZUFjdGlvbiBdLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgc3RhZ2VOYW1lOiAnQnVpbGQnLFxuICAgICAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgICAgIGNka0J1aWxkQWN0aW9uLFxuICAgICAgICAgICAgc2l0ZUJ1aWxkQWN0aW9uXG4gICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHN0YWdlTmFtZTogJ0RlcGxveScsXG4gICAgICAgICAgYWN0aW9uczogWyBkZXBsb3lBY3Rpb24gXSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSk7XG4gIH1cbn1cblxuIl19