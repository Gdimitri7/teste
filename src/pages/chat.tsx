import { CONFIG } from 'src/config-global';

import { ChatView } from 'src/sections/chat/chat';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Chat - ${CONFIG.appName}`}</title>

      <ChatView />
    </>
  );
}