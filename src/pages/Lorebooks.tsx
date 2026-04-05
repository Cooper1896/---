import { useState, useEffect } from 'react';
import { BookOpen, Plus, Edit2, Trash2, X, Save, Key } from 'lucide-react';
import { z } from 'zod';
import { Lorebook } from '../shared/contracts';

// 表单校验 Schema
const lorebookSchema = z.object({
  keys: z.string().trim().min(1, "至少需要一个关键字"),
  content: z.string().trim().min(1, "内容不能为空").max(10000, "内容过长"),
  constant: z.boolean().default(false),
  insertion_order: z.number().default(50),
  position: z.enum(['before_char', 'after_char', 'top_of_prompt', 'bottom_of_prompt']).default('before_char'),
  keyword_logic: z.enum(['ANY', 'AND', 'NOT']).default('ANY'),
  regex_matching: z.boolean().default(false),
});

type LorebookFormData = z.infer<typeof lorebookSchema>;

export default function Lorebooks() {
  const [lorebooks, setLorebooks] = useState<Lorebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 模态框状态
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<LorebookFormData>({
    keys: '',
    content: '',
    constant: false,
    insertion_order: 50,
    position: 'before_char',
    keyword_logic: 'ANY',
    regex_matching: false,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // 获取知识库列表
  const fetchLorebooks = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/lorebooks');
      if (!res.ok) throw new Error('获取知识库列表失败');
      const data = await res.json();
      setLorebooks(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLorebooks();
  }, []);

  // 处理表单输入
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    setFormData(prev => ({ ...prev, [name]: val }));
    // 清除对应字段的错误
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // 打开创建模态框
  const handleCreate = () => {
    setEditingId(null);
    setFormData({
      keys: '',
      content: '',
      constant: false,
      insertion_order: 50,
      position: 'before_char',
      keyword_logic: 'ANY',
      regex_matching: false,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // 打开编辑模态框
  const handleEdit = (lore: Lorebook) => {
    const entry: any = lore.entries?.[0] || {};
    setEditingId(lore.id);
    setFormData({
      keys: (entry.keys || []).join(', '),
      content: entry.content || '',
      constant: entry.constant || false,
      insertion_order: entry.insertion_order ?? 50,
      position: entry.position ?? 'before_char',
      keyword_logic: entry.keyword_logic ?? 'ANY',
      regex_matching: entry.regex_matching ?? false,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // 删除条目
  const handleDelete = async (id: string) => {
    if (!window.confirm('确定要删除这个知识库条目吗？此操作不可恢复。')) return;
    
    try {
      const res = await fetch(`/api/lorebooks/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('删除失败');
      setLorebooks(prev => prev.filter(l => l.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 校验表单
    try {
      lorebookSchema.parse(formData);
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
      // @ts-ignore
      alert(`Validation Error: ${JSON.stringify(err)}`);
      return;
    }

    try {
      const url = editingId ? `/api/lorebooks/${editingId}` : '/api/lorebooks';
      const method = editingId ? 'PUT' : 'POST';
      
      const payload = {
        entries: [{
          ...formData,
          keys: formData.keys.split(',').map(k => k.trim()).filter(Boolean)
        }]
      };
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) throw new Error(editingId ? '更新失败' : '创建失败');
      
      await fetchLorebooks();
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto w-full">
      {/* 头部 */}
      <div className="flex justify-between items-end mb-8 border-b-2 border-[#353535] pb-4">
        <div>
          <h1 className="text-4xl font-black text-[#FFF000] font-headline tracking-tighter uppercase flex items-center gap-3">
            <BookOpen className="w-8 h-8" />
            绳网知识库
          </h1>
          <p className="text-[#959177] font-headline tracking-widest text-sm mt-2 uppercase">
            // INTERKNOT_LOREBOOKS_DATABASE
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-[#FA5C1C] hover:bg-[#ff7a45] text-[#131313] px-6 py-3 font-bold font-headline tracking-wider flex items-center gap-2 clip-path-chamfer transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          新增知识条目
        </button>
      </div>

      {/* 列表内容 */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-[#00DAF3] font-headline animate-pulse">
          [知识库读取中...]
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center text-red-500 font-headline">
          [错误: {error}]
        </div>
      ) : lorebooks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-[#959177] font-headline border-2 border-dashed border-[#353535] p-12 clip-path-chamfer">
          <BookOpen className="w-16 h-16 mb-4 opacity-50" />
          <p className="text-xl tracking-widest">暂无知识库条目</p>
          <p className="text-sm mt-2 opacity-70">点击右上角按钮新增世界观设定</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lorebooks.map(lore => {
            const entry = lore.entries?.[0] || {} as any;
            return (
            <div key={lore.id} className={`bg-[#1a1a1a] border-2 ${entry.constant ? 'border-[#00DAF3]' : 'border-[#353535]'} p-5 clip-path-chamfer relative group hover:border-[#FFF000] transition-colors flex flex-col h-full`}>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Key className="w-4 h-4 text-[#FA5C1C]" />
                    {(entry.keys || []).map((key: string, i: number) => (
                      <span key={i} className="bg-[#2a2a2a] text-[#00DAF3] text-xs px-2 py-0.5 rounded font-headline tracking-wider">
                        {key}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-[#959177] font-headline tracking-wider mt-2">ID: {lore.id.slice(-6)}</p>
                </div>
                {entry.constant && (
                  <span className="bg-[#00DAF3]/20 text-[#00DAF3] px-2 py-1 text-xs font-bold font-headline uppercase shrink-0">
                    常驻
                  </span>
                )}
              </div>
              
              <div className="text-sm text-[#e5e2e1] line-clamp-4 mb-6 flex-1 bg-[#0e0e0e] p-3 border border-[#353535]">
                {entry.content}
              </div>

              <div className="flex justify-end gap-3 mt-auto pt-4 border-t border-[#353535]">
                <button
                  onClick={() => handleEdit(lore)}
                  className="text-[#00DAF3] hover:text-white p-2 transition-colors"
                  title="编辑条目"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(lore.id)}
                  className="text-red-500 hover:text-red-400 p-2 transition-colors"
                  title="删除条目"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* 编辑/创建模态框 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#131313] border-2 border-[#00DAF3] w-full max-w-2xl max-h-[90vh] flex flex-col clip-path-chamfer shadow-[0_0_30px_rgba(0,218,243,0.15)]">
            <div className="flex justify-between items-center p-4 border-b border-[#353535] bg-[#1a1a1a]">
              <h2 className="text-xl font-bold text-[#00DAF3] font-headline tracking-wider flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                {editingId ? '编辑知识条目' : '新增知识条目'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-[#959177] hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              <form id="lorebook-form" onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-[#959177] mb-2 cursor-pointer">
                    关键字 (Keys) * 
                    <span className="text-xs font-normal ml-2 text-[#FA5C1C]">多个关键字请用逗号 (,) 分隔</span>
                  </label>
                  <input
                    type="text"
                    name="keys"
                    value={formData.keys}
                    onChange={handleInputChange}
                    className={`w-full bg-[#0e0e0e] border ${formErrors.keys ? 'border-red-500' : 'border-[#353535] focus:border-[#00DAF3]'} text-[#e5e2e1] p-3 outline-none transition-colors`}
                    placeholder="例如：新艾利都, 绳匠, 空洞"
                  />
                  {formErrors.keys && <p className="text-red-500 text-xs mt-1">{formErrors.keys}</p>}
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#959177] mb-2">常驻 (Constant)</label>
                  <label className="flex items-center gap-3 cursor-pointer p-3 bg-[#0e0e0e] border border-[#353535] w-fit hover:border-[#00DAF3] transition-colors">
                    <input
                      type="checkbox"
                      name="constant"
                      checked={formData.constant}
                      onChange={handleInputChange}
                      className="w-5 h-5 accent-[#00DAF3] bg-[#131313] border-[#353535]"
                    />
                    <span className="text-[#e5e2e1] text-sm font-bold">始终注入上下文</span>
                  </label>
                  <p className="text-xs text-[#959177] mt-2">
                    开启后，该条目内容将在每次对话中始终被混入上下文。非常驻条目仅在对话提及关键字时触发。
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-[#959177] mb-2">位置 (Position)</label>
                    <select
                      name="position"
                      value={formData.position}
                      onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value as any }))}
                      className="w-full bg-[#0e0e0e] border border-[#353535] text-[#e5e2e1] p-3 outline-none focus:border-[#00DAF3]"
                    >
                      <option value="before_char">角色设定前 (Before Character)</option>
                      <option value="after_char">角色设定后 (After Character)</option>
                      <option value="top_of_prompt">提示词顶部 (Top of Prompt)</option>
                      <option value="bottom_of_prompt">提示词底部 (Bottom of Prompt)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#959177] mb-2">注入优先级 (Insertion Order)</label>
                    <input
                      type="number"
                      name="insertion_order"
                      value={formData.insertion_order}
                      onChange={(e) => setFormData(prev => ({ ...prev, insertion_order: parseInt(e.target.value) || 0 }))}
                      className="w-full bg-[#0e0e0e] border border-[#353535] text-[#e5e2e1] p-3 outline-none focus:border-[#00DAF3]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#959177] mb-2">关键字逻辑 (Keyword Logic)</label>
                    <select
                      name="keyword_logic"
                      value={formData.keyword_logic}
                      onChange={(e) => setFormData(prev => ({ ...prev, keyword_logic: e.target.value as any }))}
                      className="w-full bg-[#0e0e0e] border border-[#353535] text-[#e5e2e1] p-3 outline-none focus:border-[#00DAF3]"
                    >
                      <option value="ANY">任意匹配 (ANY)</option>
                      <option value="AND">全部匹配 (AND)</option>
                      <option value="NOT">排除匹配 (NOT)</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                     <label className="flex items-center gap-3 cursor-pointer p-3 bg-[#0e0e0e] border border-[#353535] hover:border-[#00DAF3] transition-colors w-full h-[52px]">
                      <input
                        type="checkbox"
                        name="regex_matching"
                        checked={formData.regex_matching}
                        onChange={handleInputChange}
                        className="w-5 h-5 accent-[#00DAF3] bg-[#131313] border-[#353535]"
                      />
                      <span className="text-[#e5e2e1] text-sm font-bold">正则匹配 (Regex)</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#959177] mb-2">正文内容 (Content) *</label>
                  <textarea
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    rows={8}
                    className={`w-full bg-[#0e0e0e] border ${formErrors.content ? 'border-red-500' : 'border-[#353535] focus:border-[#00DAF3]'} text-[#e5e2e1] p-3 outline-none transition-colors resize-y`}
                    placeholder="输入知识库的详细设定内容..."
                  />
                  {formErrors.content && <p className="text-red-500 text-xs mt-1">{formErrors.content}</p>}
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
                form="lorebook-form"
                className="bg-[#00DAF3] hover:bg-[#33e2f5] text-[#131313] px-8 py-2 font-bold font-headline tracking-wider flex items-center gap-2 clip-path-chamfer transition-transform hover:scale-105 active:scale-95"
              >
                <Save className="w-4 h-4" />
                保存条目
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
