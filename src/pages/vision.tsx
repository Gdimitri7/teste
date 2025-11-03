import { CONFIG } from 'src/config-global';

import { VisionBoardView } from 'src/sections/visionboard/vision';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Vision - ${CONFIG.appName}`}</title>

      <VisionBoardView />
    </>
  );
}

