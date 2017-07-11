import { WebSocketChat.FrontendPage } from './app.po';

describe('web-socket-chat.frontend App', () => {
  let page: WebSocketChat.FrontendPage;

  beforeEach(() => {
    page = new WebSocketChat.FrontendPage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Welcome to app!!');
  });
});
