import * as vscode from "vscode";
import { getNonce } from "../../utils/getNonce";
import { Logger } from '../../utils/logger';

export class ThinkbitSidebar implements vscode.WebviewViewProvider {
    public static readonly sideBarId = "thinkbit.SidebarProvider";
    private static activeInstances: Set<ThinkbitSidebar> = new Set();
    public view?: vscode.WebviewView | vscode.WebviewPanel;

    

    constructor(
        readonly context: vscode.ExtensionContext,
    ) {
        ThinkbitSidebar.activeInstances.add(this);
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        this.view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.context.extensionUri]
        };

        webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'sendMessage':
                    // 处理发送的消息
                    console.log('Message sent:', message.text);
                    console.log('Using model:', message.model);
                    console.log('Service mode:', message.serviceMode);
                    // 这里实现实际的功能
                    break;
                case 'changeModel':
                    // 处理模型更改
                    console.log('Model changed to:', message.model);
                    break;
                case 'changeServiceMode':
                    // 处理服务模式更改
                    console.log('Service mode changed to:', message.serviceMode);
                    break;
            }
        });
    }

    public refresh() {
        if (this.view) {
            this.view.webview.html = this.getHtmlForWebview(this.view.webview);
        }
    }

    private getHtmlForWebview(webview: vscode.Webview): string {
        const logger = Logger.getInstance();
        // 生成一个用于CSP的nonce
        const nonce = getNonce();

        // 获取webview的本地资源路径
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.context.extensionUri, "src", "core", "gui", "dist", "sidebar.js")
        );
        const styleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.context.extensionUri,  "src", "core", "gui", "dist", "sidebar.css")
        );

        // 返回HTML内容
        return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <link rel="stylesheet" href="${styleUri}">
        </head>
        <body>
          <div id="app"></div>
          <script src="${scriptUri}"></script>
        </body>
      </html>
    `;
    }

    public static getActiveInstance(): ThinkbitSidebar | undefined {
        return ThinkbitSidebar.activeInstances.values().next().value;
    }
}