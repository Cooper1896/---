import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, X, Save, Image as ImageIcon } from 'lucide-react';
import { z } from 'zod';

// 角色类型定义
interface Character {
  id: string;
  name: string;
  description: string;
  personality: string;
  first_mes: string;
  mes_example: string;
  avatar?: string;
  creator_notes?: string;
  system_prompt?: string;
  post_history_instructions?: string;
  alternate_greetings?: string[];
  tags?: string[];
}

// 表单校验 Schema
const characterSchema = z.object({
  name: z.string().trim().min(1, "名称不能为空").max(120, "名称过长"),
  description: z.string().max(10000).default(""),
  personality: z.string().max(10000).default(""),
  first_mes: z.string().max(10000).default(""),
  mes_example: z.string().max(20000).default(""),
  avatar: z.string().max(5_000_000).optional(),
  creator_notes: z.string().max(20000).optional(),
  system_prompt: z.string().max(20000).optional(),
  post_history_instructions: z.string().max(20000).optional(),
  alternate_greetings: z.array(z.string().max(10000)).optional(),
  tags: z.array(z.string().trim()).optional(),
});

type CharacterFormData = z.infer<typeof characterSchema>;

export default function Characters() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 模态框状态
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced' | 'metadata'>('basic');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CharacterFormData>({
    name: '',
    description: '',
    personality: '',
    first_mes: '',
    mes_example: '',
    avatar: '',
    creator_notes: '',
    system_prompt: '',
    post_history_instructions: '',
    alternate_greetings: [],
    tags: [],
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // 获取角色列表
  const fetchCharacters = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/characters');
      if (!res.ok) throw new Error('获取角色列表失败');
      const data = await res.json();
      setCharacters(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCharacters();
  }, []);

  // 处理表单输入
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // 清除对应字段的错误
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleArrayInputChange = (name: string, value: string) => {
    // 简单地按换行符分割作为数组项
    const arr = value.split('\n').map(v => v.trim()).filter(v => v !== '');
    setFormData(prev => ({ ...prev, [name]: arr }));
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tags = e.target.value.split(',').map(t => t.trim()).filter(t => t !== '');
    setFormData(prev => ({ ...prev, tags }));
  };

  // 打开创建模态框
  const handleCreate = () => {
    setEditingId(null);
    setActiveTab('basic');
    setFormData({
      name: '',
      description: '',
      personality: '',
      first_mes: '',
      mes_example: '',
      avatar: '',
      creator_notes: '',
      system_prompt: '',
      post_history_instructions: '',
      alternate_greetings: [],
      tags: [],
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // 打开编辑模态框
  const handleEdit = (char: Character) => {
    setEditingId(char.id);
    setActiveTab('basic');
    setFormData({
      name: char.name,
      description: char.description || '',
      personality: char.personality || '',
      first_mes: char.first_mes || '',
      mes_example: char.mes_example || '',
      avatar: char.avatar || '',
      creator_notes: char.creator_notes || '',
      system_prompt: char.system_prompt || '',
      post_history_instructions: char.post_history_instructions || '',
      alternate_greetings: char.alternate_greetings || [],
      tags: char.tags || [],
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // 删除角色
  const handleDelete = async (id: string) => {
    if (!window.confirm('确定要删除这个代理人档案吗？此操作不可恢复。')) return;
    
    try {
      const res = await fetch(`/api/characters/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('删除失败');
      setCharacters(prev => prev.filter(c => c.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 校验表单
    try {
      characterSchema.parse(formData);
      setFormErrors({});
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        const zodErr = err as any;
        if (zodErr.errors) {
          zodErr.errors.forEach((e: any) => {
            if (e.path[0]) errors[e.path[0].toString()] = e.message;
          });
        }
        setFormErrors(errors);
        return;
      }
      console.error('Validation failed', err);
      alert(`Validation Error: ${JSON.stringify(err)}`);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto w-full">
      {/* 头部 */}
      <div className="flex justify-between items-end mb-8 border-b-2 border-[#353535] pb-4">
        <div>
          <h1 className="text-4xl font-black text-[#FFF000] font-headline tracking-tighter uppercase flex items-center gap-3">
            <Users className="w-8 h-8" />
            代理人档案库
          </h1>
          <p className="text-[#959177] font-headline tracking-widest text-sm mt-2 uppercase">
            // AGENT_PROFILES_DATABASE
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-[#FA5C1C] hover:bg-[#ff7a45] text-[#131313] px-6 py-3 font-bold font-headline tracking-wider flex items-center gap-2 clip-path-chamfer transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          录入新档案
        </button>
      </div>

      {/* 列表内容 */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-[#00DAF3] font-headline animate-pulse">
          [系统读取中...]
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center text-red-500 font-headline">
          [错误: {error}]
        </div>
      ) : characters.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-[#959177] font-headline border-2 border-dashed border-[#353535] p-12 clip-path-chamfer">
          <Users className="w-16 h-16 mb-4 opacity-50" />
          <p className="text-xl tracking-widest">暂无代理人档案</p>
          <p className="text-sm mt-2 opacity-70">点击右上角按钮录入新档案</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {characters.map(char => (
            <div key={char.id} className="bg-[#1a1a1a] border-2 border-[#353535] p-5 clip-path-chamfer relative group hover:border-[#00DAF3] transition-colors flex flex-col h-full">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 bg-[#2a2a2a] border border-[#353535] flex items-center justify-center shrink-0 overflow-hidden">
                  {char.avatar ? (
                    <img src={char.avatar} alt={char.name} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-[#959177]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-[#e5e2e1] truncate" title={char.name}>{char.name}</h3>
                  <p className="text-xs text-[#959177] font-headline tracking-wider mt-1">ID: {char.id.slice(-6)}</p>
                  {char.tags && char.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {char.tags.slice(0, 3).map((tag, idx) => (
                        <span key={idx} className="bg-[#2a2a2a] text-[#00DAF3] text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap">
                          {tag}
                        </span>
                      ))}
                      {char.tags.length > 3 && (
                        <span className="bg-[#2a2a2a] text-[#00DAF3] text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap">
                          +{char.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="text-sm text-[#959177] line-clamp-3 mb-6 flex-1 mt-2">
                {char.description || '暂无描述信息...'}
              </div>

              <div className="flex justify-end gap-3 mt-auto pt-4 border-t border-[#353535]">
                <button
                  onClick={() => handleEdit(char)}
                  className="text-[#00DAF3] hover:text-white p-2 transition-colors"
                  title="编辑档案"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(char.id)}
                  className="text-red-500 hover:text-red-400 p-2 transition-colors"
                  title="删除档案"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 编辑/创建模态框 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#131313] border-2 border-[#00DAF3] w-full max-w-2xl max-h-[90vh] flex flex-col clip-path-chamfer shadow-[0_0_30px_rgba(0,218,243,0.15)]">
            <div className="flex justify-between items-center p-4 border-b border-[#353535] bg-[#1a1a1a]">
              <h2 className="text-xl font-bold text-[#00DAF3] font-headline tracking-wider">
                {editingId ? '编辑代理人档案' : '录入新代理人'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-[#959177] hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex border-b border-[#353535]">
              <button
                type="button"
                onClick={() => setActiveTab('basic')}
                className={`flex-1 py-3 text-sm font-bold font-headline tracking-wider transition-colors ${
                  activeTab === 'basic' ? 'bg-[#00DAF3]/10 text-[#00DAF3] border-b-2 border-[#00DAF3]' : 'text-[#959177] hover:text-[#e5e2e1] hover:bg-[#2a2a2a]'
                }`}
              >
                基本信息
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('advanced')}
                className={`flex-1 py-3 text-sm font-bold font-headline tracking-wider transition-colors ${
                  activeTab === 'advanced' ? 'bg-[#00DAF3]/10 text-[#00DAF3] border-b-2 border-[#00DAF3]' : 'text-[#959177] hover:text-[#e5e2e1] hover:bg-[#2a2a2a]'
                }`}
              >
                高级提示词
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('metadata')}
                className={`flex-1 py-3 text-sm font-bold font-headline tracking-wider transition-colors ${
                  activeTab === 'metadata' ? 'bg-[#00DAF3]/10 text-[#00DAF3] border-b-2 border-[#00DAF3]' : 'text-[#959177] hover:text-[#e5e2e1] hover:bg-[#2a2a2a]'
                }`}
              >
                元数据
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              <form id="character-form" onSubmit={handleSubmit} className="space-y-6">
                
                {/* 基础信息 */}
                <div className={activeTab === 'basic' ? 'space-y-6' : 'hidden'}>
                <div>
                  <label className="block text-sm font-bold text-[#959177] mb-2">代号 / 名称 *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full bg-[#0e0e0e] border ${formErrors.name ? 'border-red-500' : 'border-[#353535] focus:border-[#00DAF3]'} text-[#e5e2e1] p-3 outline-none transition-colors`}
                    placeholder="输入代理人名称"
                  />
                  {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#959177] mb-2">头像 URL (可选)</label>
                  <input
                    type="text"
                    name="avatar"
                    value={formData.avatar}
                    onChange={handleInputChange}
                    className="w-full bg-[#0e0e0e] border border-[#353535] focus:border-[#00DAF3] text-[#e5e2e1] p-3 outline-none transition-colors"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#959177] mb-2">档案描述 (Description)</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full bg-[#0e0e0e] border border-[#353535] focus:border-[#00DAF3] text-[#e5e2e1] p-3 outline-none transition-colors resize-y"
                    placeholder="代理人的背景故事、外貌特征等..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#959177] mb-2">性格特征 (Personality)</label>
                  <textarea
                    name="personality"
                    value={formData.personality}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full bg-[#0e0e0e] border border-[#353535] focus:border-[#00DAF3] text-[#e5e2e1] p-3 outline-none transition-colors resize-y"
                    placeholder="性格特点、说话方式..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#959177] mb-2">初始问候 (First Message)</label>
                  <textarea
                    name="first_mes"
                    value={formData.first_mes}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full bg-[#0e0e0e] border border-[#353535] focus:border-[#00DAF3] text-[#e5e2e1] p-3 outline-none transition-colors resize-y"
                    placeholder="对话开始时的第一句话..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#959177] mb-2">对话示例 (Mes Example)</label>
                  <textarea
                    name="mes_example"
                    value={formData.mes_example}
                    onChange={handleInputChange}
                    rows={5}
                    className="w-full bg-[#0e0e0e] border border-[#353535] focus:border-[#00DAF3] text-[#e5e2e1] p-3 outline-none transition-colors resize-y font-mono text-sm"
                    placeholder="<START>\nUser: 你好\nChar: 你好，找我有什么事吗？"
                  />
                </div>
                </div>

                {/* 高级提示词 */}
                <div className={activeTab === 'advanced' ? 'space-y-6' : 'hidden'}>
                  <div>
                    <label className="block text-sm font-bold text-[#959177] mb-2 mr-2">系统提示词覆盖 (System Prompt)</label>
                    <textarea
                      name="system_prompt"
                      value={formData.system_prompt || ''}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full bg-[#0e0e0e] border border-[#353535] focus:border-[#00DAF3] text-[#e5e2e1] p-3 outline-none transition-colors resize-y font-mono text-sm"
                      placeholder="留空则使用全局系统提示词..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#959177] mb-2 mr-2">前置历史指令 (Post-History Instructions)</label>
                    <textarea
                      name="post_history_instructions"
                      value={formData.post_history_instructions || ''}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full bg-[#0e0e0e] border border-[#353535] focus:border-[#00DAF3] text-[#e5e2e1] p-3 outline-none transition-colors resize-y font-mono text-sm"
                      placeholder="插入到Prompt最末尾的指令，例如：严格遵循之前的格式。..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#959177] mb-2 mr-2">替代问候语 (Alternate Greetings)</label>
                    <p className="text-xs text-[#959177] mb-2">每行一条，随机使用</p>
                    <textarea
                      name="alternate_greetings"
                      value={(formData.alternate_greetings || []).join('\n')}
                      onChange={(e) => handleArrayInputChange('alternate_greetings', e.target.value)}
                      rows={5}
                      className="w-full bg-[#0e0e0e] border border-[#353535] focus:border-[#00DAF3] text-[#e5e2e1] p-3 outline-none transition-colors resize-y font-mono text-sm"
                      placeholder="替代问候语1\n替代问候语2..."
                    />
                  </div>
                </div>

                {/* 元数据 */}
                <div className={activeTab === 'metadata' ? 'space-y-6' : 'hidden'}>
                  <div>
                    <label className="block text-sm font-bold text-[#959177] mb-2 mr-2">标签 (Tags)</label>
                    <p className="text-xs text-[#959177] mb-2">使用逗号 (,) 分隔</p>
                    <input
                      type="text"
                      name="tags"
                      value={(formData.tags || []).join(', ')}
                      onChange={handleTagsChange}
                      className="w-full bg-[#0e0e0e] border border-[#353535] focus:border-[#00DAF3] text-[#e5e2e1] p-3 outline-none transition-colors"
                      placeholder="例如：御姐, 冰山, 傲娇..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#959177] mb-2 mr-2">作者笔记 (Creator Notes)</label>
                    <textarea
                      name="creator_notes"
                      value={formData.creator_notes || ''}
                      onChange={handleInputChange}
                      rows={5}
                      className="w-full bg-[#0e0e0e] border border-[#353535] focus:border-[#00DAF3] text-[#e5e2e1] p-3 outline-none transition-colors resize-y"
                      placeholder="给玩家或者自己的留言..."
                    />
                  </div>
                </div>
              </form>
            </div>

            <div className="p-4 border-t border-[#353535] bg-[#1a1a1a] flex justify-end gap-4">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2 text-[#959177] hover:text-white font-bold transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                form="character-form"
                className="bg-[#00DAF3] hover:bg-[#33e2f5] text-[#131313] px-8 py-2 font-bold font-headline tracking-wider flex items-center gap-2 clip-path-chamfer transition-transform hover:scale-105 active:scale-95"
              >
                <Save className="w-4 h-4" />
                保存档案
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
