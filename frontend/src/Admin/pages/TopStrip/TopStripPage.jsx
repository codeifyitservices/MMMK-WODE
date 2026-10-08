import React, { useEffect, useState, useMemo } from 'react';
import { Switch, Input, Button, message, Spin, Card } from 'antd';
import { Plus, Trash2, Save } from 'lucide-react';
import { getAdminTopStrip, updateTopStrip } from '../../../apis/admin/editPage';
import { useQuery } from '@tanstack/react-query';
import { useGlobalContext } from '../../../context/GlobalProvider';

const getContrastColor = (hexColor) => {
  if (!hexColor) return '#ffffff';
  const hex = hexColor.replace('#', '');
  if (hex.length !== 6) return '#ffffff';
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? '#000000' : '#ffffff';
};

export default function TopStripPage() {
  const { refetchTopStrip } = useGlobalContext();
  const [enabled, setEnabled] = useState(false);
  const [messages, setMessages] = useState(['']);
  const [backgroundColor, setBackgroundColor] = useState('#28120b');
  const [saving, setSaving] = useState(false);

  const { data: topStripData, isLoading, refetch } = useQuery({
    queryKey: ['admin-top-strip'],
    queryFn: getAdminTopStrip,
  });

  useEffect(() => {
    if (topStripData) {
      setEnabled(topStripData.enabled ?? false);
      setMessages(
        topStripData.messages && topStripData.messages.length > 0
          ? [...topStripData.messages]
          : ['']
      );
      setBackgroundColor(topStripData.backgroundColor || '#28120b');
    }
  }, [topStripData]);

  const handleAddMessage = () => {
    if (messages.length < 3) {
      setMessages([...messages, '']);
    }
  };

  const handleMessageChange = (index, value) => {
    const updated = [...messages];
    updated[index] = value;
    setMessages(updated);
  };

  const handleRemoveMessage = (index) => {
    if (index === 0) {
      // First field cannot be removed, only cleared
      const updated = [...messages];
      updated[0] = '';
      setMessages(updated);
    } else {
      const updated = messages.filter((_, i) => i !== index);
      setMessages(updated);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Validate that at least one message is present if enabled
      if (enabled && messages.filter((m) => m && m.trim() !== '').length === 0) {
        message.warning('Please provide at least one message when enabled.');
        setSaving(false);
        return;
      }

      await updateTopStrip({
        enabled,
        messages,
        backgroundColor,
      });

      message.success('Top Strip settings saved successfully.');
      refetch();
      if (refetchTopStrip) {
        refetchTopStrip();
      }
    } catch (error) {
      console.error(error);
      message.error(error?.response?.data?.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const textColor = useMemo(() => getContrastColor(backgroundColor), [backgroundColor]);

  const activeMessages = useMemo(() => {
    const active = messages.filter((msg) => msg && msg.trim() !== '');
    if (active.length === 0) return ['PREVIEW MESSAGE'];
    return active;
  }, [messages]);


  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spin size="large" tip="Loading Top Strip configuration..." />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card className="shadow-md rounded-lg overflow-hidden border border-gray-200">
        <div className="border-b border-gray-100 pb-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Top Information Strip</h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure a scrolling information banner running sitewide above the navbar.
          </p>
        </div>

        {/* Visibility Toggle */}
        <div className="flex items-center justify-between mb-8 p-4 bg-gray-50 rounded-lg">
          <div>
            <h3 className="font-semibold text-gray-700">Sitewide Visibility</h3>
            <p className="text-xs text-gray-400">Toggle to enable or disable the marquee strip sitewide.</p>
          </div>
          <Switch
            checked={enabled}
            onChange={(checked) => setEnabled(checked)}
            checkedChildren="Enabled"
            unCheckedChildren="Disabled"
            className={enabled ? 'bg-green-600' : 'bg-gray-400'}
          />
        </div>

        {/* Messages Input List */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-700">Scrolling Messages</h3>
              <p className="text-xs text-gray-400">
                Add up to 3 custom messages to scroll infinitely (separated by ✦).
              </p>
            </div>
            {messages.length < 3 && (
              <Button
                type="dashed"
                onClick={handleAddMessage}
                icon={<Plus size={16} />}
                className="flex items-center gap-1 hover:text-amber-700 hover:border-amber-700"
              >
                Add Message
              </Button>
            )}
          </div>

          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className="flex items-center gap-3">
                <span className="text-xs font-semibold text-gray-400 w-6">#{index + 1}</span>
                <Input
                  value={msg}
                  onChange={(e) => handleMessageChange(index, e.target.value)}
                  placeholder={`Enter message #${index + 1}...`}
                  maxLength={150}
                  className="flex-1 rounded-md"
                />
                <Button
                  danger
                  type="text"
                  onClick={() => handleRemoveMessage(index)}
                  icon={<Trash2 size={18} />}
                  className="flex items-center justify-center p-2 text-red-500 hover:bg-red-50"
                  title={index === 0 ? 'Clear text' : 'Remove message'}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Color Selection */}
        <div className="mb-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-2">Custom Background Color</h3>
          <p className="text-xs text-gray-400 mb-4">
            Select a custom color for the strip. Text color adapts automatically for readability.
          </p>
          <div className="flex items-center gap-4">
            <input
              type="color"
              value={backgroundColor}
              onChange={(e) => setBackgroundColor(e.target.value)}
              className="w-12 h-12 rounded cursor-pointer border border-gray-300"
            />
            <div>
              <span className="text-xs font-mono bg-white px-3 py-1.5 border border-gray-200 rounded text-gray-700">
                {backgroundColor.toUpperCase()}
              </span>
              <div className="text-[10px] text-gray-400 mt-1">
                Luminance-based text color: <strong style={{ color: textColor }}>{textColor === '#ffffff' ? 'White' : 'Black'}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Live Preview */}
        <div className="mb-8 border border-gray-200 rounded-lg p-6 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Live Preview</h3>
            {enabled && (
              <span className="text-[10px] bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded uppercase">
                Active Animation
              </span>
            )}
          </div>
          {enabled ? (
            <div
              style={{ backgroundColor, color: textColor }}
              className="w-full h-12 flex items-center overflow-hidden relative select-none text-xs md:text-sm tracking-widest border border-black/10 rounded-md font-medium shadow-inner"
            >
              <div className="relative w-full h-full overflow-hidden">
                {/* Animated container */}
                <div
                  className="animate-marquee-custom h-full"
                  style={{
                    '--marquee-duration': `${activeMessages.length * 20}s`,
                    '--marquee-duration-mobile': `${activeMessages.length * 10}s`,
                    width: 'max-content',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {/* Part 1 */}
                  {activeMessages.map((msg, index) => (
                    <div
                      key={`prev1-${index}`}
                      style={{ minWidth: '100%' }}
                      className="flex-shrink-0 flex items-center justify-center h-full px-12 md:px-16 text-center uppercase whitespace-nowrap gap-4 md:gap-6"
                    >
                      <span>{msg || '(Empty Message)'}</span>
                      <span className="opacity-60 text-[10px] md:text-xs">✦</span>
                    </div>
                  ))}
                  {/* Part 2 (Duplicate for seamless loop) */}
                  {activeMessages.map((msg, index) => (
                    <div
                      key={`prev2-${index}`}
                      style={{ minWidth: '100%' }}
                      className="flex-shrink-0 flex items-center justify-center h-full px-12 md:px-16 text-center uppercase whitespace-nowrap gap-4 md:gap-6"
                      aria-hidden="true"
                    >
                      <span>{msg || '(Empty Message)'}</span>
                      <span className="opacity-60 text-[10px] md:text-xs">✦</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full h-12 flex items-center justify-center border border-dashed border-gray-300 rounded-md bg-white text-gray-400 text-sm">
              Top Strip is Disabled (Hidden sitewide)
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="flex justify-end border-t border-gray-100 pt-6">
          <Button
            type="primary"
            onClick={handleSave}
            loading={saving}
            icon={<Save size={16} />}
            className="flex items-center gap-2 bg-[#635D4A] hover:bg-[#4d4838] border-none text-white h-10 px-6 rounded-md font-semibold"
          >
            Save Changes
          </Button>
        </div>
      </Card>
    </div>
  );
}
