import { CONFIG } from 'src/config-global';

import { AgendaView } from 'src/sections/agenda/agenda';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Products - ${CONFIG.appName}`}</title>

      <AgendaView />
    </>
  );
}


