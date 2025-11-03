import { CONFIG } from 'src/config-global';

import { UserProfileView } from 'src/sections/auth/profile';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Perfil - ${CONFIG.appName}`}</title>

      <UserProfileView />
    </>
  );
}

