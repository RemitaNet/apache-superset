import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Divider,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Tabs,
  Tooltip,
  Typography,
  Collapse,
  Badge,
} from 'antd';
import {
  BellOutlined,
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  KeyOutlined,
  LinkOutlined,
  PlusOutlined,
  MoreOutlined,
  TagOutlined,
  BarsOutlined,
} from '@ant-design/icons';
import ControlHeader from '../../../../../src/explore/components/ControlHeader';
import {Controlled as CodeMirror} from 'react-codemirror2';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/material.css';
import 'codemirror/mode/javascript/javascript';

const { Option } = Select;
const { TabPane } = Tabs;
const { Panel } = Collapse; // Destructure Panel from Collapse

const STYLE_OPTIONS = [
  { value: 'default', label: 'Default' },
  { value: 'primary', label: 'Primary' },
  { value: 'danger', label: 'Danger' },
  { value: 'success', label: 'Success' },
  { value: 'warning', label: 'Warning' },
];

const VISIBILITY_CONDITION_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'selected', label: 'Selected' },
  { value: 'unselected', label: 'UnSelected' },
];

// Map style values to colors
const STYLE_COLORS = {
  default: 'grey',
  primary: 'blue',
  danger: 'red',
  success: 'green',
  warning: 'orange',
};

const renderingStyles = `
    .remita-action-setup .ant-collapse-content-box {
      padding: 0;
    }
    .remita-action-setup .ant-card-head-wrapper {
      max-height: 1rem;
    }
    .remita-action-setup .ant-card-head {
      min-height: 2rem;
      padding: 5px 4px !important;
    }
  `;

const parseInitialValue = (value, valueColumn) => {
  if (!value) return []; // Return empty array if value is null or undefined

  let actions = [];

  // Parse the value if it's a string
  if (typeof value === 'string') {
    try {
      actions = JSON.parse(value);
    } catch (error) {
      actions = []; // Return empty array if parsing fails
    }
  } else if (Array.isArray(value)) {
    actions = value; // Use the value directly if it's already an array
  } else if (value instanceof Set) {
    actions = Array.from(value); // Convert Set to array
  } else {
    actions = []; // Return empty array for other cases
  }

  // Update valueColumn property if valueColumn is provided and not empty
  if (valueColumn && actions.length > 0) {
    actions = actions.map((action) => ({
      ...action,
      valueColumn: valueColumn, // Update valueColumn property
    }));
  }
  return actions;
};
const NonSplitActionsControl = ({
                                  initialValue = [],
                                  onChange = () => {},
                                  language = 'json',
                                  readOnly = false,
                                  offerEditInModal = true,
                                  ...rest
                                }) => {
  const valueColumn = rest.valueColumn;
  const [actions, setActions] = useState(() => parseInitialValue(rest.value || rest.default,valueColumn));

  const [editingIndex, setEditingIndex] = useState(null); // if null, then adding a new action
  const [showAddForm, setShowAddForm] = useState(false);
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [isPublishEvent, setIsPublishEvent] = useState(false);
  const [activeTab, setActiveTab] = useState('simple');
  const [advancedJson, setAdvancedJson] = useState('');

  // When modal opens and Advanced tab is active, update JSON text
  useEffect(() => {
    if (modalVisible && activeTab === 'advanced') {
      if (editingIndex !== null) {
        setAdvancedJson(JSON.stringify(actions[editingIndex], null, 2));
      } else {
        setAdvancedJson(JSON.stringify(actions, null, 2));
      }
    }
  }, [modalVisible, activeTab, actions, editingIndex]);

  const closeModal = () => {
    setModalVisible(false);
    setEditingIndex(null);
    setShowAddForm(false);
    form.resetFields();
  };

  const openModal = () => {
    setModalVisible(true);
    setEditingIndex(null);
    // If no actions exist, default to showing the add form
    setShowAddForm(actions.length === 0);
    form.resetFields();
  };

  const openAddModal = () => {
    openModal();
  };

  // In modal Simple tab, reveal the add form
  const revealAddForm = () => {
    setShowAddForm(true);
    setEditingIndex(null);
    form.resetFields();
  };

  const handleAddAction = (values) => {
    const newAction = {
      key: values.key,
      valueColumn: valueColumn,
      label: values.label,
      style: values.style,
      boundToSelection: values.boundToSelection,
      visibilityCondition: values.visibilityCondition,
      publishEvent: values.publishEvent || false,
      actionUrl: !values.publishEvent ? values.actionUrl : undefined,
      showInSliceHeader: values.showInSliceHeader || false,
    };
    const updatedActions = [...actions, newAction];
    setActions(updatedActions);
    onChange(JSON.stringify(updatedActions));
    form.resetFields();
    setShowAddForm(false);
    setEditingIndex(null);
  };

  const handleEditAction = (values) => {
    const updatedAction = {
      key: values.key,
      label: values.label,
      valueColumn: valueColumn,
      style: values.style,
      boundToSelection: values.boundToSelection,
      visibilityCondition: values.visibilityCondition,
      publishEvent: values.publishEvent || false,
      actionUrl: !values.publishEvent ? values.actionUrl : undefined,
      showInSliceHeader: values.showInSliceHeader || false,
    };
    const updatedActions = actions.map((action, idx) =>
      idx === editingIndex ? updatedAction : action
    );
    setActions(updatedActions);
    onChange(JSON.stringify(updatedActions));
    form.resetFields();
    setEditingIndex(null);
  };

  const handleRemoveAction = (index) => {
    const updatedActions = actions.filter((_, idx) => idx !== index);
    setActions(updatedActions);
    onChange(JSON.stringify(updatedActions));
  };

  const validateUniqueKey = (_, value) => {
    if (!value) return Promise.resolve();
    const duplicate = actions.some(
      (action, idx) => idx !== editingIndex && action.key === value
    );
    return duplicate
      ? Promise.reject(new Error('Action key must be unique'))
      : Promise.resolve();
  };

  const validateUniqueLabel = (_, value) => {
    if (!value) return Promise.resolve();
    const duplicate = actions.some(
      (action, idx) => idx !== editingIndex && action.label === value
    );
    return duplicate
      ? Promise.reject(new Error('Action label must be unique'))
      : Promise.resolve();
  };

  // Component to render the TagOutlined icon with dynamic styles
  const TagIcon = ({ action }) => {
    // Determine the color based on the action.style value
    const color = STYLE_COLORS[action.style] || STYLE_COLORS.default;

    return (
      <TagOutlined
        style={{
          color: color,
          fontSize: '0.8rem',
        }}
      />
    );
  };

  // Render form fields used for adding/editing in the Simple tab
  const renderFormFields = () => (
    <>
      <Form.Item
        name="key"
        label="Key"
        rules={[
          { required: true, message: 'Please enter a key' },
          { validator: validateUniqueKey },
        ]}
      >
        <Input placeholder="Action key" />
      </Form.Item>
      <Form.Item
        name="label"
        label="Label"
        rules={[
          { required: true, message: 'Please enter a label' },
          { validator: validateUniqueLabel },
        ]}
      >
        <Input placeholder="Action label" />
      </Form.Item>
      <Form.Item
        name="style"
        label="Style"
        rules={[{ required: true, message: 'Please select a style' }]}
      >
        <Select placeholder="Select a style">
          {STYLE_OPTIONS.map((option) => (
            <Option key={option.value} value={option.value}>
              {option.label}
            </Option>
          ))}
        </Select>
      </Form.Item>
      <Form.Item name="boundToSelection" valuePropName="checked">
        <Checkbox>Bound to Selection</Checkbox>
      </Form.Item>
      <Form.Item
        name="visibilityCondition"
        label="Visibility Condition"
        rules={[{ required: true, message: 'Please select a visibility condition' }]}
      >
        <Select placeholder="Select a visibility condition">
          {VISIBILITY_CONDITION_OPTIONS.map((option) => (
            <Option key={option.value} value={option.value}>
              {option.label}
            </Option>
          ))}
        </Select>
      </Form.Item>
      <Form.Item name="publishEvent" valuePropName="checked">
        <Checkbox onChange={(e) => setIsPublishEvent(e.target.checked)}>
          Publish Event
        </Checkbox>
      </Form.Item>
      <Form.Item shouldUpdate={(prev, cur) => prev.publishEvent !== cur.publishEvent} noStyle>
        {({ getFieldValue }) =>
          !getFieldValue('publishEvent') && (
            <Form.Item
              name="actionUrl"
              label="Action URL"
              rules={[{ required: true, message: 'Please enter an action URL' }]}
            >
              <Input placeholder="Enter action URL" />
            </Form.Item>
          )}
      </Form.Item>
      <Form.Item name="showInSliceHeader" valuePropName="checked">
        <Checkbox>Show In Slice Header</Checkbox>
      </Form.Item>
    </>
  );

  // Render a single action card (mirroring the Split UI)
  const renderCard = (action, index) => (
    <Card
      key={index}
      title={
        <div style={{ fontWeight: 'bold', fontSize: '0.8rem', padding: '2px 4px' }}>
          {action.key}
        </div>
      }
      headStyle={{ padding: '2px 4px' }}
      extra={
        !readOnly && (
          <div style={{ display: 'flex', gap: 4 }}>
            <Button
              size="small"
              type="text"
              icon={<EditOutlined />}
              onClick={() => openModalWithEdit(index)}
            />
            <Button
              size="small"
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleRemoveAction(index)}
            />
          </div>
        )
      }
      style={{ marginBottom: '4px' }}
      bodyStyle={{ padding: '4px' }}
    >
      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <Space>
          <Tooltip title={`Style: ${action.style}`}>
            <TagIcon action={action} />
          </Tooltip>
          <Tooltip title={`Bound: ${action.boundToSelection ? 'Yes' : 'No'}`}>
            {action.boundToSelection ? (
              <CheckOutlined style={{ color: 'green', fontSize: '0.8rem' }} />
            ) : (
              <CloseOutlined style={{ color: 'red', fontSize: '0.8rem' }} />
            )}
          </Tooltip>
          <Tooltip title={`Visibility: ${action.visibilityCondition}`}>
            <EyeOutlined style={{ fontSize: '0.8rem' }} />
          </Tooltip>
          <Tooltip title={`Publish Event: ${action.publishEvent ? 'Yes' : 'No'}`}>
            <BellOutlined style={{ color: action.publishEvent ? 'green' : 'grey', fontSize: '0.8rem' }} />
          </Tooltip>
          {!action.publishEvent && action.actionUrl && (
            <Tooltip title={`Action URL: ${action.actionUrl}`}>
              <LinkOutlined style={{ fontSize: '0.8rem' }} />
            </Tooltip>
          )}
          <Tooltip title={`Show In Slice Header: ${action.showInSliceHeader ? 'Yes' : 'No'}`}>
            <BarsOutlined style={{ color: action.showInSliceHeader ? 'green' : 'grey', fontSize: '0.8rem' }} />
          </Tooltip>
        </Space>
      </Space>
    </Card>
  );

  // Open modal in edit mode for a selected action
  const openModalWithEdit = (index) => {
    const action = actions[index];
    setEditingIndex(index);
    form.setFieldsValue({
      key: action.key,
      label: action.label,
      style: action.style,
      boundToSelection: action.boundToSelection,
      visibilityCondition: action.visibilityCondition,
      publishEvent: action.publishEvent,
      actionUrl: action.actionUrl,
      showInSliceHeader: action.showInSliceHeader,
    });
    setIsPublishEvent(action.publishEvent);
    setModalVisible(true);
  };

  // Render modal content with tabs for Simple (form and list) and Advanced (JSON)
  const renderModalContent = () => {
    const handleTabChange = (key) => {
      setActiveTab(key);
      if (key === 'advanced') {
        if (editingIndex !== null) {
          setAdvancedJson(JSON.stringify(actions[editingIndex], null, 2));
        } else {
          setAdvancedJson(JSON.stringify(actions, null, 2));
        }
      }
    };

    const schemaInfo = (
      <Collapse defaultActiveKey={[]} ghost>
        <Panel header="JSON Schema Information" key="1">
          <div style={{ marginBottom: '8px' }}>
            <p>
              The JSON configuration should follow this structure:
            </p>
            <pre>
          {`
[
  {
    "key": "action_key", // Unique identifier for the action
    "style": "default", // Style to use when rendering
    "label": "Action Label", // Display name for the action
    "boundToSelection": true, // Whether the action is bound to row selection
    "visibilityCondition": "selected", // Visibility condition (e.g., "selected" or "all")
    "publishEvent": false, // Whether the action publishes an event
    "actionUrl": "/action-url", // URL to navigate to (if publishEvent is false)
    "showInSliceHeader": true // Whether to show the action in the slice header
  }
]
          `}
        </pre>
            <p>
              <strong>Note:</strong> The <code>visibilityCondition</code> determines when the action is visible.
              It can be set to <code>"selected"</code> (visible only when rows are selected) or <code>"all"</code> (always visible).
            </p>
          </div>
        </Panel>
      </Collapse>
    );
    // Define a placeholder for the Advanced Tab
    const advancedTabPlaceholder = JSON.stringify(
      [
        {
          key: 'delete',
          label: 'Delete',
          style: 'danger',
          boundToSelection: true,
          visibilityCondition: 'selected',
          publishEvent : false,
          actionUrl: "/slice/1",
          showInSliceHeader: true
        },
      ],
      null,
      2
    );

    return (
      <Tabs activeKey={activeTab} onChange={handleTabChange}>
        <TabPane tab="Simple" key="simple">
          {(showAddForm || editingIndex !== null) && (
            <>
              <Form
                form={form}
                onFinish={editingIndex === null ? handleAddAction : handleEditAction}
                layout="vertical"
                style={{ marginBottom: '8px' }}
              >
                {renderFormFields()}
                <Space style={{ marginTop: 8 }}>
                  <Button type="primary" htmlType="submit">
                    {editingIndex === null ? 'Add Action' : 'Save Changes'}
                  </Button>
                  <Button onClick={closeModal}>Cancel</Button>
                </Space>
              </Form>
              <Divider style={{ margin: '8px 0' }} />
            </>
          )}
          <Space direction="vertical" style={{ width: '100%' }}>
            {actions.length === 0 ? (
              <Alert
                message="No actions added yet."
                type="info"
                showIcon
                style={{ marginBottom: '8px' }}
              />
            ) : (
              actions.map((action, index) => renderCard(action, index))
            )}
          </Space>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <Button size="small" type="primary" icon={<PlusOutlined />} onClick={revealAddForm}>
              Add New Action
            </Button>
          </div>
        </TabPane>
        <TabPane tab="Advanced" key="advanced">
          {schemaInfo} {/* Display schema information inside an accordion */}
          <CodeMirror
            value={actions.length === 0 ? '' : advancedJson} // Set to empty string if no actions
            placeholder={actions.length === 0 ? advancedTabPlaceholder : ''} // Show placeholder if no actions
            options={{
              mode: 'javascript',
              theme: 'material',
              lineNumbers: true,
              readOnly: false,
            }}
            onBeforeChange={(editor, data, value) => {
              setAdvancedJson(value);
            }}
          />
          <Space style={{ marginTop: 8 }}>
            <Button
              type="primary"
              onClick={() => {
                try {
                  const parsed = JSON.parse(advancedJson);
                  if (editingIndex !== null) {
                    const updatedActions = actions.map((action, idx) =>
                      idx === editingIndex ? parsed : action
                    );
                    setActions(updatedActions);
                    onChange(JSON.stringify(updatedActions));
                  } else {
                    setActions(parsed);
                    onChange(JSON.stringify(parsed));
                  }
                } catch (err) {
                  message.error('Invalid JSON');
                }
              }}
            >
              Save JSON
            </Button>
            <Button onClick={closeModal}>Cancel</Button>
          </Space>
        </TabPane>
      </Tabs>
    );
  };
  const renderInlineContent = () => (
  <>
    <style>{renderingStyles}</style>
    <Collapse
      defaultActiveKey={['1']}
      ghost
      className={'remita-action-setup'}
      expandIconPosition="right" // Ensures the arrow is positioned on the right
      expandIcon={({ isActive }) => (
        <span
          style={{
            display: 'inline-block',
            transform: isActive ? 'rotate(90deg)' : 'rotate(-90deg)',
            transition: 'transform 0.2s ease',
          }}
        >
        <svg viewBox="64 64 896 896" focusable="false" data-icon="right" width="1em" height="1em" fill="currentColor"
             aria-hidden="true" ><path
          d="M765.7 486.8L314.9 134.7A7.97 7.97 0 00302 141v77.3c0 4.9 2.3 9.6 6.1 12.6l360 281.1-360 281.1c-3.9 3-6.1 7.7-6.1 12.6V883c0 6.7 7.7 10.4 12.9 6.3l450.8-352.1a31.96 31.96 0 000-50.4z"></path></svg>
      </span>

      )}
      style={{width: '100%', padding: 0}}
    >
      <Collapse.Panel
        key="1"
        style={{padding: 0}}
        header={
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <span>Table Non-Split Actions</span>
            <Badge
              count={actions.length}
              style={{
                padding: '0 8px',
                marginLeft: '8px',
                borderRadius: '4px',
                fontSize: '12px',
                backgroundColor: '#eee',
                color: '#666',
                fontWeight: 500,
              }}
            />
          </div>
        }
      >
        <div direction="vertical" style={{ width: '100%', padding: 0 }}>
          {actions.length === 0 ? (
            <>
              <Alert
                message="No table header actions added yet."
                type="info"
                showIcon
                style={{ marginBottom: '8px' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  size="small"
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={openAddModal}
                >
                  Add New Action
                </Button>
              </div>
            </>
          ) : (
            actions.map((action, index) => renderCard(action, index))
          )}
        </div>
      </Collapse.Panel>
    </Collapse>
  </>
  );


  return (
    <div>
      <ControlHeader onChange={onChange} />
      {offerEditInModal ? (
        <>
          <div style={{ marginBottom: '8px' }}>
            {actions.length === 0 ? (
              <>
                <Alert
                  message="No actions added yet."
                  type="info"
                  showIcon
                  style={{ marginBottom: '8px' }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button size="small" type="primary" icon={<PlusOutlined />} onClick={openAddModal}>
                    Add New Action
                  </Button>
                </div>
              </>
            ) : (
              renderInlineContent()
            )}
          </div>
          {!readOnly && actions.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <Button size="small" type="primary" onClick={openAddModal} icon={<EditOutlined />}>
                Edit Actions
              </Button>
            </div>
          )}
          <Modal
            title="Manage Actions"
            visible={modalVisible}
            onCancel={closeModal}
            footer={<Button size="small" onClick={closeModal}>Done</Button>}
            width="500px"
            bodyStyle={{ padding: '12px' }}
          >
            {renderModalContent()}
          </Modal>
        </>
      ) : (
        renderInlineContent()
      )}
    </div>
  );
};

NonSplitActionsControl.propTypes = {
  initialValue: PropTypes.array,
  onChange: PropTypes.func,
  language: PropTypes.string,
  readOnly: PropTypes.bool,
  offerEditInModal: PropTypes.bool,
};

export default NonSplitActionsControl;
