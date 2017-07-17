# WebSocketChat

This project is a typical chat web-application which uses WebSockets to communicate between the frontend (using Angular 4) and the backend (using .NET Core).

### Requirements
* Standalone [.NET Core SDK](https://www.microsoft.com/net/download/core) or alternatively  [Visual Studio 2017](https://www.visualstudio.com/downloads/).
* node package manager (NPM), part of [node.js](https://nodejs.org/en/).

### Backend Usage
1. Navigate to .NET Core backend project in `./WebSocketChat.Server/WebSocketChatServer`.
2. Restore packages with `dotnet restore` and start local server with `dotnet run`.

or..

1. Open the backend project in VS2017, wait till the NuGet packages are restored and start the IIS-Express server with F5.

## Frontend Usage
1. Navigate to `./WebSocketChat.Frontend`
2. Install required node modules with `npm install`
3. Configure URL to connect to your running backend server in `./WebSocketChat.Frontend/src/environments/environment.prod.ts` -> property `websocketBaseUrl` (you can see the url of your server in the command-line if you've started it with `dotnet run`). The suffix `/chat` shouldn't be changed.
4. Run `ng serve` for a dev server. Navigate to `http://localhost:4200/` to open the application. The app will automatically reload if you change any of the source files.
