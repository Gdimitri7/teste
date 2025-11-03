import { CONFIG } from 'src/config-global';

import { ExpensesReportView } from 'src/sections/expenses/ExpensesReportView';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Relatorios - ${CONFIG.appName}`}</title>

      <ExpensesReportView />
    </>
  );
}
