import { CONFIG } from 'src/config-global';

import { AddExpenseView } from 'src/sections/expenses/AddExpenseView';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Add Gastos - ${CONFIG.appName}`}</title>

      <AddExpenseView />
    </>
  );
}


