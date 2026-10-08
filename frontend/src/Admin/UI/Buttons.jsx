import { Button } from 'antd';
import {
  LuEye,
  LuPencil,
  LuPlus,
  LuRefreshCcw,
  LuTrash2,
} from 'react-icons/lu';

export const CommonButton = ({
  children,
  onClick,
  disabled = false,
  icon = null,
  type = 'default',
  loading = false,
  danger = false,
  ...restProps
}) => {
  return (
    <Button
      loading={loading}
      danger={danger}
      type={type}
      icon={icon}
      onClick={onClick}
      disabled={disabled}
      {...restProps}
    >
      {children}
    </Button>
  );
};

export const EditButton = ({ children, ...props }) => {
  return (
    <CommonButton
      icon={<LuPencil />}
      type="primary"
      title="Edit"
      color="success"
      ghost
      {...props}
    >
      {children}
    </CommonButton>
  );
};

export const DeleteButton = ({ children, ...props }) => {
  return (
    <CommonButton danger icon={<LuTrash2 />} title="Delete" {...props}>
      {children}
    </CommonButton>
  );
};

export const AddButton = ({ children, ...props }) => {
  return (
    <CommonButton icon={<LuPlus />} type="primary" title="Add" {...props}>
      {children}
    </CommonButton>
  );
};

export const ViewButton = ({ children, ...props }) => {
  return (
    <CommonButton
      icon={<LuEye />}
      color="blue"
      type="primary"
      ghost
      title="View"
      {...props}
    >
      {children}
    </CommonButton>
  );
};

export const RefreshButton = ({ children, onClick, isLoading = false }) => {
  return (
    <CommonButton
      icon={<LuRefreshCcw />}
      title="Refresh"
      onClick={onClick}
      loading={isLoading}
    >
      {children}
    </CommonButton>
  );
};
