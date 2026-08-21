import { useEffect, useState } from 'react';
import {
  Check,
  Cloud,
  CloudOff,
  Copy,
  LoaderCircle,
  LogOut,
  RefreshCw,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { useCloudRoom, type CloudRoomStatus } from '../cloud/CloudRoomProvider';
import { isValidRoomCode, normalizeRoomCode } from '../cloud/roomApi';

const statusText: Record<CloudRoomStatus, string> = {
  local: '本地模式',
  unconfigured: '本地模式',
  loading: '正在读取',
  saving: '正在保存',
  synced: '已同步',
  offline: '离线保存',
  conflict: '需要确认',
  error: '同步异常',
};

export default function CloudRoomControl() {
  const cloud = useCloudRoom();
  const [open, setOpen] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (cloud.hasConflict) setOpen(true);
  }, [cloud.hasConflict]);

  const run = async (action: () => Promise<void>) => {
    setWorking(true);
    try {
      await action();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '操作失败，请稍后重试');
    } finally {
      setWorking(false);
    }
  };

  const handleCreate = () => run(async () => {
    const code = await cloud.createRoom();
    toast.success(`云端房间 ${code} 已创建`);
  });

  const handleJoin = () => run(async () => {
    const code = normalizeRoomCode(inputCode);
    if (!isValidRoomCode(code)) throw new Error('请输入完整的 8 位房间码');
    if (!window.confirm('打开房间后，当前画面将切换为该房间的云端存档。确定继续吗？')) return;
    await cloud.joinRoom(code);
    setInputCode('');
    toast.success(`已打开房间 ${code}`);
  });

  const copyText = async (text: string, success: string) => {
    await navigator.clipboard.writeText(text);
    toast.success(success);
  };

  const shareUrl = cloud.roomCode
    ? `${window.location.origin}${window.location.pathname}#/?room=${cloud.roomCode}`
    : '';

  const busy = working || cloud.status === 'loading' || cloud.status === 'saving';
  const StatusIcon = cloud.status === 'offline' || cloud.status === 'error'
    ? CloudOff
    : cloud.status === 'loading' || cloud.status === 'saving'
      ? LoaderCircle
      : cloud.status === 'synced'
        ? Check
        : Cloud;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'fixed bottom-[5.8rem] right-3 z-30 flex h-12 w-12 items-center justify-center gap-2 rounded-full border bg-white/95 text-sm font-semibold shadow-lg shadow-slate-300/30 backdrop-blur transition hover:-translate-y-0.5 sm:right-6 sm:h-auto sm:w-auto sm:px-3.5 sm:py-2.5',
          cloud.status === 'conflict' || cloud.status === 'error'
            ? 'border-amber-200 text-amber-700'
            : cloud.roomCode
              ? 'border-blue-100 text-blue-700'
              : 'border-slate-200 text-slate-600',
        )}
        aria-label="打开云端存档"
      >
        <Cloud size={18} className="sm:hidden" />
        <StatusIcon
          size={17}
          className={cn(
            'hidden sm:block',
            (cloud.status === 'loading' || cloud.status === 'saving') && 'animate-spin',
          )}
        />
        <span
          className={cn(
            'absolute right-0.5 top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white sm:hidden',
            cloud.status === 'synced' && 'bg-emerald-500',
            (cloud.status === 'loading' || cloud.status === 'saving') && 'animate-pulse bg-blue-500',
            (cloud.status === 'conflict' || cloud.status === 'offline') && 'bg-amber-500',
            cloud.status === 'error' && 'bg-red-500',
            (cloud.status === 'local' || cloud.status === 'unconfigured') && 'bg-slate-300',
          )}
        />
        <span className="hidden sm:inline">{cloud.roomCode ?? statusText[cloud.status]}</span>
        {cloud.roomCode && (
          <span className="hidden font-normal text-slate-400 sm:inline">· {statusText[cloud.status]}</span>
        )}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/30 p-0 backdrop-blur-[2px] sm:items-center sm:p-6"
          onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)}
        >
          <section className="w-full max-w-md rounded-t-[2rem] border border-white bg-white p-6 shadow-2xl sm:rounded-[2rem]">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-200">
                  <Cloud size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">云端存档</h2>
                  <p className="mt-0.5 text-sm text-slate-500">使用房间码在不同设备继续游戏</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={19} />
              </button>
            </div>

            {!cloud.configured ? (
              <div className="mt-6 rounded-2xl border border-amber-100 bg-amber-50 p-4">
                <p className="font-semibold text-amber-900">云端服务等待配置</p>
                <p className="mt-1.5 text-sm leading-6 text-amber-800/80">
                  当前仍会安全地保存在这台设备上。配置 Supabase 项目后，这里会自动启用创建与打开房间功能。
                </p>
              </div>
            ) : cloud.hasConflict ? (
              <div className="mt-6">
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="font-semibold text-amber-900">发现两份不同的存档</p>
                  <p className="mt-1.5 text-sm leading-6 text-amber-800/80">
                    另一台设备先更新了这个房间。请选择要继续使用的版本。
                  </p>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => run(() => cloud.resolveConflict('cloud'))}
                    className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    使用云端版本
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => run(() => cloud.resolveConflict('local'))}
                    className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
                  >
                    用本机覆盖
                  </button>
                </div>
              </div>
            ) : cloud.roomCode ? (
              <div className="mt-6">
                <div className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50/60 p-5 text-center">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">当前房间</p>
                  <button
                    type="button"
                    onClick={() => copyText(cloud.roomCode!, '房间码已复制')}
                    className="mt-2 inline-flex items-center gap-2 text-3xl font-bold tracking-[0.12em] text-slate-950"
                  >
                    {cloud.roomCode}
                    <Copy size={17} className="text-blue-500" />
                  </button>
                  <div className="mt-3 flex items-center justify-center gap-2 text-sm text-slate-500">
                    <StatusIcon
                      size={15}
                      className={cn((cloud.status === 'loading' || cloud.status === 'saving') && 'animate-spin')}
                    />
                    {statusText[cloud.status]}
                    {cloud.revision !== null && <span>· 版本 {cloud.revision}</span>}
                  </div>
                </div>

                {cloud.error && (
                  <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">{cloud.error}</p>
                )}

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => run(cloud.syncNow)}
                    className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    <RefreshCw size={16} className={cn(busy && 'animate-spin')} />
                    立即同步
                  </button>
                  <button
                    type="button"
                    onClick={() => copyText(shareUrl, '房间链接已复制')}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                  >
                    <Copy size={16} />
                    复制链接
                  </button>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => run(async () => {
                    await cloud.leaveRoom();
                    toast.success('已回到本地模式');
                  })}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-800 disabled:opacity-50"
                >
                  <LogOut size={16} />
                  退出房间（数据仍保留）
                </button>
              </div>
            ) : (
              <div className="mt-6">
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleCreate}
                  className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:brightness-105 disabled:opacity-50"
                >
                  {busy ? '正在创建…' : '用当前数据创建房间'}
                </button>

                <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
                  <span className="h-px flex-1 bg-slate-200" />
                  或打开已有房间
                  <span className="h-px flex-1 bg-slate-200" />
                </div>

                <div className="flex gap-2">
                  <input
                    value={inputCode}
                    onChange={(event) => setInputCode(normalizeRoomCode(event.target.value))}
                    onKeyDown={(event) => event.key === 'Enter' && void handleJoin()}
                    placeholder="AB7K-P2QX"
                    inputMode="text"
                    autoCapitalize="characters"
                    className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-base font-bold tracking-[0.1em] text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
                  />
                  <button
                    type="button"
                    disabled={busy || !isValidRoomCode(inputCode)}
                    onClick={handleJoin}
                    className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    打开
                  </button>
                </div>
                <p className="mt-4 text-center text-xs leading-5 text-slate-400">
                  房间码相当于存档密码，请只分享给一起游戏的人。
                </p>
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}
