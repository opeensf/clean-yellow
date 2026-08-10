import { ArrowLeft, Minus, Plus, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { cn } from '../lib/utils';

const FEE_STEP = 1500;

export default function Insurance() {
  const navigate = useNavigate();
  const { players, updatePlayerInsuranceFee, togglePlayerInsurance } = useGameStore();
  const enabledCount = players.filter((player) => player.insuranceEnabled).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/70 to-indigo-50">
      <header className="sticky top-0 z-10 border-b border-white/80 bg-white/80 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/')}
              aria-label="返回首页"
              className="rounded-xl p-2.5 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 shadow-lg shadow-blue-500/20">
                <Shield className="text-white" size={22} />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900">官方保险</h1>
                <p className="text-xs text-slate-500">保费与投保状态</p>
              </div>
            </div>
          </div>

          <div className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700">
            {enabledCount}/{players.length} 已启用
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="grid gap-4 md:grid-cols-2">
          {players.map((player) => {
            const initial = Array.from(player.name.trim())[0] || '玩';

            return (
              <article
                key={player.id}
                className="rounded-3xl border border-white/90 bg-white/85 p-5 shadow-sm shadow-slate-200/70 backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-100/60"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3.5">
                    <div
                      className="flex shrink-0 items-center justify-center rounded-2xl text-xl font-bold text-white shadow-md ring-4 ring-white"
                      style={{ width: 52, height: 52, backgroundColor: player.color }}
                    >
                      {initial}
                    </div>
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-semibold text-slate-900">{player.name}</h2>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span
                          className={cn(
                            'h-3.5 w-3.5 rounded-full ring-4 transition-colors',
                            player.insuranceEnabled
                              ? 'bg-emerald-500 ring-emerald-100'
                              : 'bg-slate-300 ring-slate-100',
                          )}
                        />
                        <span
                          className={cn(
                            'text-sm font-medium',
                            player.insuranceEnabled ? 'text-emerald-700' : 'text-slate-500',
                          )}
                        >
                          {player.insuranceEnabled ? '保障中' : '未启用'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={player.insuranceEnabled}
                    aria-label={`${player.name}保险${player.insuranceEnabled ? '已启用' : '未启用'}`}
                    onClick={() => togglePlayerInsurance(player.id)}
                    className={cn(
                      'relative h-9 w-16 shrink-0 rounded-full p-1 shadow-inner transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-blue-100',
                      player.insuranceEnabled ? 'bg-emerald-500' : 'bg-slate-300',
                    )}
                  >
                    <span
                      className={cn(
                        'block h-7 w-7 rounded-full bg-white shadow-md transition-transform duration-200',
                        player.insuranceEnabled ? 'translate-x-7' : 'translate-x-0',
                      )}
                    />
                  </button>
                </div>

                <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400">当前保费</p>
                  <div className="mt-1 flex items-end justify-between gap-3">
                    <p className="text-3xl font-bold tracking-tight text-blue-600">
                      <span className="mr-1 text-lg font-semibold">¥</span>
                      {player.insuranceFee.toLocaleString()}
                    </p>
                    <span className="pb-1 text-xs text-slate-400">每次调整 ¥{FEE_STEP.toLocaleString()}</span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => updatePlayerInsuranceFee(player.id, -FEE_STEP)}
                    disabled={player.insuranceFee === 0}
                    className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Minus size={17} />
                    降低保费
                  </button>
                  <button
                    type="button"
                    onClick={() => updatePlayerInsuranceFee(player.id, FEE_STEP)}
                    className="flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all hover:from-blue-600 hover:to-indigo-700 hover:shadow-lg"
                  >
                    <Plus size={17} />
                    增加保费
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </main>
    </div>
  );
}
