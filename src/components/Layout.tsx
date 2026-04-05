import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  Cpu,
  Radio,
  UserCircle2,
  ShieldCheck,
  Network,
  TerminalSquare,
  Settings,
  LogOut,
} from 'lucide-react';

export default function Layout() {
  const location = useLocation();

  return (
    <div className="bg-[#131313] text-[#e5e2e1] font-sans overflow-hidden selection:bg-[#f5e700] selection:text-[#353100] min-h-screen relative flex">
      <div className="fixed inset-0 bg-noise pointer-events-none z-[100]"></div>
      <div className="fixed inset-0 crt-scanlines pointer-events-none z-[101]"></div>

      <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-6 py-3 bg-[#131313]/90 backdrop-blur-md border-b-4 border-[#353535]">
        <div className="flex items-center gap-4">
          <div className="text-xl font-black italic text-[#FFF000] font-headline tracking-tighter">
            新艾利都代理人
          </div>
          <div className="h-4 w-[2px] bg-[#353535]"></div>
          <div className="font-headline tracking-widest uppercase text-xs flex gap-6">
            <Link to="/" className={`pb-1 ${location.pathname === '/' ? 'text-[#FFF000] border-b-2 border-[#FFF000]' : 'text-[#959177] hover:bg-[#FFF000] hover:text-[#131313] transition-all duration-75 hover:skew-x-2'}`}>区域</Link>
            <Link to="/time-sync" className={`pb-1 ${location.pathname === '/time-sync' ? 'text-[#FFF000] border-b-2 border-[#FFF000]' : 'text-[#959177] hover:bg-[#FFF000] hover:text-[#131313] transition-all duration-75 hover:skew-x-2'}`}>时间同步</Link>
            <a href="#" className="text-[#959177] hover:bg-[#FFF000] hover:text-[#131313] transition-all duration-75 hover:skew-x-2">信号</a>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-4">
            <Cpu className="w-5 h-5 text-[#959177] hover:text-[#FFF000] cursor-pointer" />
            <Radio className="w-5 h-5 text-[#959177] hover:text-[#FFF000] cursor-pointer" />
            <UserCircle2 className="w-5 h-5 text-[#FFF000] cursor-pointer" />
          </div>
        </div>
      </nav>

      <aside className="fixed left-0 top-0 h-screen flex flex-col pt-20 bg-[#0e0e0e] w-64 border-r-4 border-[#353535] z-40 hidden md:flex">
        <div className="px-6 mb-8">
          <div className="text-2xl font-black text-[#FA5C1C] font-headline mb-1">ZENLESS_ID</div>
          <div className="font-headline font-bold text-sm tracking-tighter text-[#959177] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            [RANK: S]
          </div>
        </div>

        <nav className="flex-1 px-2">
          <Link 
            to="/" 
            className={`p-4 my-2 mx-2 font-headline font-bold text-sm tracking-tighter flex items-center gap-3 transition-transform duration-100 ${location.pathname === '/' ? 'bg-[#FFF000] text-[#131313] clip-path-chamfer' : 'text-[#959177] hover:bg-[#353535] hover:translate-x-2 hover:text-[#00DAF3]'}`}
          >
            <Network className="w-5 h-5" /> 代理人网络
          </Link>
          <Link 
            to="/hollow-input" 
            className={`p-4 my-2 mx-2 font-headline font-bold text-sm tracking-tighter flex items-center gap-3 transition-transform duration-100 ${location.pathname === '/hollow-input' ? 'bg-[#FFF000] text-[#131313] clip-path-chamfer' : 'text-[#959177] hover:bg-[#353535] hover:translate-x-2 hover:text-[#00DAF3]'}`}
          >
            <Radio className="w-5 h-5" /> 深度空洞
          </Link>
          <Link 
            to="/inter-knot" 
            className={`p-4 my-2 mx-2 font-headline font-bold text-sm tracking-tighter flex items-center gap-3 transition-transform duration-100 ${location.pathname === '/inter-knot' ? 'bg-[#FFF000] text-[#131313] clip-path-chamfer' : 'text-[#959177] hover:bg-[#353535] hover:translate-x-2 hover:text-[#00DAF3]'}`}
          >
            <TerminalSquare className="w-5 h-5" /> 绳网
          </Link>
        </nav>

        <div className="mt-auto border-t border-[#353535] p-4 space-y-2">
          <Link to="/settings" className="text-[#959177] p-2 flex items-center gap-3 hover:text-white transition-colors cursor-pointer text-xs font-bold w-full">
            <Settings className="w-4 h-4" /> 系统设置
          </Link>
          <div className="text-[#959177] p-2 flex items-center gap-3 hover:text-red-500 transition-colors cursor-pointer text-xs font-bold">
            <LogOut className="w-4 h-4" /> 退出登录
          </div>
        </div>
      </aside>

      <main className="md:ml-64 pt-24 pb-20 px-8 min-h-screen relative flex flex-col w-full overflow-y-auto">
        <Outlet />
      </main>

      <footer className="fixed bottom-0 w-full z-50 flex justify-between items-center px-8 py-2 bg-[#131313] border-t-2 border-[#FA5C1C]/30">
        <div className="flex items-center gap-6">
          <div className="text-xs font-bold text-[#FFF000] font-headline italic">录制 // 状态: 激活</div>
          <div className="font-headline text-[10px] tracking-[0.2em] font-light text-[#959177]">
            [REC] 00:04:21:09 // VER 1.0.2_BUILD
          </div>
        </div>
        <div className="flex items-center gap-8">
          <div className="flex gap-6 font-headline text-[10px] tracking-[0.2em] font-light hidden md:flex">
            <a href="#" className="text-[#FFF000] hover:text-white transition-colors">数据政策</a>
            <a href="#" className="text-[#959177] hover:text-white transition-colors">硬件 ID</a>
            <a href="#" className="text-[#959177] hover:text-white transition-colors">信号地图</a>
          </div>
          <div className="h-6 w-px bg-[#353535] hidden md:block"></div>
          <div className="text-[#FA5C1C] font-headline text-[10px] font-bold tracking-widest">艾利都系统内核</div>
        </div>
      </footer>
    </div>
  );
}
