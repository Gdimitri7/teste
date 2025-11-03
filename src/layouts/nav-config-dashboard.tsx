import { Label } from 'src/components/label';
import { SvgColor } from 'src/components/svg-color';

// ----------------------------------------------------------------------

const icon = (name: string) => <SvgColor src={`/assets/icons/navbar/${name}.svg`} />;

export type NavItem = {
  title: string;
  path: string;
  icon: React.ReactNode;
  info?: React.ReactNode;
  textColor?: string;
};

export const navData = [
  {
    title: 'Dashboard',
    path: '/dashboard',
    icon: icon('ic-dash'),
    textColor: '#5c5259' 
  },
  {
    title: 'Pagamentos',
    path: '/expense',
    icon: icon('ic-conta'),
    textColor: '#5c5259' 

  },
   {
    title: 'Investimentos',
    path: '/stock',
    icon: icon('ic-conta'),
    textColor: '#5c5259' 

  },
  {
    title: 'Vision Board',
    path: '/vision',
    icon: icon('ic-vision'),
    textColor: '#5c5259'
    
  },
  {
    title: 'Agenda',
    path: '/agenda',
    icon: icon('ic-agenda'),
    textColor: '#5c5259'
  
  },
  {
  title: 'Chat',
  path: '/chat',       
  icon: icon('ic-chat'),
  textColor: '#5c5259' 
},
{
  title: 'Relatório',
  path: '/report',       
  icon: icon('ic-reports'),
  textColor: '#5c5259' 
},

];
