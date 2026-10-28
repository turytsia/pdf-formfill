import type React from 'react';
import { css } from '@emotion/css';
import { useEditor } from '../../state/EditorContext';
import { MOBILE_MEDIA } from '../../styles/breakpoints';
import { revealItem } from '../../utilities/revealItem';
import { FieldList } from './FieldList';
import { HintsFooter } from './HintsFooter';
import { PropertiesPanel } from './PropertiesPanel';

interface SidePanelProps {
  // While the on-screen keyboard is up only the properties header is shown.
  collapsedOnMobile: boolean;
  // Phones show the field list as a sheet only when asked for.
  fieldsOpenOnMobile: boolean;
  onCloseFields: () => void;
}

export const SidePanel: React.FC<SidePanelProps> = ({
  collapsedOnMobile,
  fieldsOpenOnMobile,
  onCloseFields,
}) => {
  const { state } = useEditor();
  const hasSelection = state.selectedId !== null;

  return (
    <aside
      className={styles.root}
      aria-label='Inspector'
      data-properties-panel
      data-open={hasSelection || fieldsOpenOnMobile}
      data-mode={hasSelection ? 'properties' : 'fields'}
      data-collapsed={collapsedOnMobile}
    >
      <PropertiesPanel />
      <FieldList
        items={state.items}
        selectedId={state.selectedId}
        onReveal={revealItem}
        onClose={onCloseFields}
      />
      <HintsFooter />
    </aside>
  );
};

const styles = {
  root: css`
    flex-shrink: 0;
    width: var(--panel-width);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-left: 1px solid var(--color-border);
    background: var(--color-bg);

    ${MOBILE_MEDIA} {
      position: absolute;
      left: 0;
      right: 0;
      bottom: var(--mobile-rail-height);
      z-index: 3;
      width: auto;
      max-height: 55%;
      overflow-y: auto;
      border-left: 0;
      border-top: 1px solid var(--color-border);
      border-radius: 16px 16px 0 0;
      box-shadow: 0 -16px 48px rgba(0, 0, 0, 0.6);

      &[data-open='false'] {
        display: none;
      }

      /* The sheet shows either the selected field's properties or the field list. */
      &[data-mode='properties'] > [data-section='fields'],
      &[data-mode='properties'] > [data-section='hints'],
      &[data-mode='fields'] > [data-section='properties'] {
        display: none;
      }

      &[data-collapsed='true'] {
        bottom: 0;
        max-height: 48px;
        overflow: hidden;
      }
    }
  `,
};
