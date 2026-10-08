import { Button, Tabs } from 'antd';
import { LuArrowRight, LuSave } from 'react-icons/lu';

export const FormTabs = ({
  items = [],
  onCancel,
  onSave,
  activeTab,
  updateUtils,
  isLoading = false,
  isActionDisabled = false,
}) => {
  return (
    <div className="relative flex flex-col gap-2">
      <Tabs
        items={items}
        activeKey={activeTab}
        onChange={(key) => {
          updateUtils({ activeTab: parseInt(key, 10) });
        }}
        className="max-h-[70vh] overflow-y-auto pb-8"
        tabPosition="top"
        tabBarStyle={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          backgroundColor: 'white',
        }}
      />
      <div className="flex items-center justify-between">
        <Button onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        {activeTab >= items.length - 1 ? (
          <Button
            disabled={isActionDisabled}
            loading={isLoading}
            icon={<LuSave />}
            type="primary"
            onClick={onSave}
          >
            Save
          </Button>
        ) : (
          <Button
            disabled={isActionDisabled}
            loading={isLoading}
            icon={<LuArrowRight />}
            iconPosition="end"
            type="primary"
            onClick={onSave}
          >
            Next
          </Button>
        )}
      </div>
    </div>
  );
};
