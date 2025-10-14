import type { Context } from './context';

export type ChallengeResult =
	| { ok: true }
	| { ok: false; code: number; msg: string };

export interface ChallengeProvider {
	validate(req: Request, ctx: Context): Promise<ChallengeResult>;
}

/** 当前默认实现：什么都不做，直接放行 */
export class NoopChallengeProvider implements ChallengeProvider {
	async validate(_req: Request, _ctx: Context): Promise<ChallengeResult> {
		return { ok: true };
	}
}

// 未来：接入付费/验证码/证明等
// export class PaidChallengeProvider implements ChallengeProvider { ... }

export function makeChallengeProvider(env: { CHALLENGE_MODE?: string }): ChallengeProvider {
	const mode = (env.CHALLENGE_MODE || 'none').toLowerCase();
	switch (mode) {
		case 'none':
		default:
			return new NoopChallengeProvider();
		// 未来扩展：
		// case 'paid': return new PaidChallengeProvider(env);
	}
}
