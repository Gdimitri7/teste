import { CONFIG } from 'src/config-global';

import { StocksView } from 'src/sections/stock/stocks';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Chat - ${CONFIG.appName}`}</title>

      <StocksView />
    </>
  );
}
