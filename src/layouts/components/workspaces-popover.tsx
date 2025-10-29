import type { ButtonBaseProps } from '@mui/material/ButtonBase';

import { useState, useCallback } from 'react';
import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Popover from '@mui/material/Popover';
import MenuList from '@mui/material/MenuList';
import ButtonBase from '@mui/material/ButtonBase';
import MenuItem, { menuItemClasses } from '@mui/material/MenuItem';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export type WorkspacesPopoverProps = ButtonBaseProps & {
  data?: {
    id: string;
    name: string;
    logo: string;
    plan: string;
  }[];
};

export function WorkspacesPopover({ data = [], sx, ...other }: WorkspacesPopoverProps) {
  const [workspace, setWorkspace] = useState(data[0]);

  const [openPopover, setOpenPopover] = useState<HTMLButtonElement | null>(null);

  const handleOpenPopover = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setOpenPopover(event.currentTarget);
  }, []);

  const handleClosePopover = useCallback(() => {
    setOpenPopover(null);
  }, []);

  const handleChangeWorkspace = useCallback(
    (newValue: (typeof data)[number]) => {
      setWorkspace(newValue);
      handleClosePopover();
    },
    [handleClosePopover]
  );

  const renderAvatar = (alt: string, src: string) => (
    <Box component="img" alt={alt} src={src} sx={{ width: 24, height: 24, borderRadius: '50%' }} />
  );

  const renderLabel = (plan: string) => (
    <Label color={plan === 'Free' ? 'default' : 'info'}>{plan}</Label>
  );

              return (
               <>
                  <Popover open={!!openPopover} anchorEl={openPopover} onClose={handleClosePopover}>
                    <MenuList
                      disablePadding
                      sx={{
                        p: 0.5,
                        gap: 0.5,
                        width: 260,
                        display: 'flex',
                        flexDirection: 'column',
                        [`& .${menuItemClasses.root}`]: {
                          p: 1.5,
                          gap: 1.5,
                          borderRadius: 0.75,
                          [`&.${menuItemClasses.selected}`]: {
                            bgcolor: 'action.selected',
                            fontWeight: 'fontWeightSemiBold',
                          },
                        },
                      }}
                    >
                      {data.map((option) => (
                        <MenuItem
                          key={option.id}
                          selected={option.id === workspace?.id}
                          onClick={() => handleChangeWorkspace(option)}
                        >
                          {renderAvatar(option.name, option.logo)}

                          <Box component="span" sx={{ flexGrow: 1 }}>
                            {option.name}
                          </Box>

                          {renderLabel(option.plan)}
                        </MenuItem>
                      ))}
                    </MenuList>
                  </Popover>
                </>
              );
            }
