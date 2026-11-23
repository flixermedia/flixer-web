// Spring physics and keyframe generator for lyrics animation.
// Coordinates stay within 0.005px of the piecewise-linear curve.

function simplifyMotionSamples<T extends { offset: number }>(samples: T[], coordinates: (sample: T) => number[]): T[] {
	const values = samples.map(coordinates);
	const retained = new Set([0, samples.length - 1]);
	const visit = (first: number, last: number): void => {
		let largestError = 0.005;
		let split = -1;
		for (let index = first + 1; index < last; index += 1) {
			const progress = (samples[index].offset - samples[first].offset) / (samples[last].offset - samples[first].offset);
			for (let axis = 0; axis < values[index].length; axis += 1) {
				const interpolated = values[first][axis] + (values[last][axis] - values[first][axis]) * progress;
				const error = Math.abs(values[index][axis] - interpolated);
				if (error > largestError) {
					largestError = error;
					split = index;
				}
			}
		}
		if (split !== -1) {
			retained.add(split);
			visit(first, split);
			visit(split, last);
		}
	};
	visit(0, samples.length - 1);
	return samples.filter((_, index) => retained.has(index));
}

export function sampleSpring(position: number, velocity: number, time: number, frequency: number, damping = 0.9 * frequency): { position: number; velocity: number } {
	const omega = Math.sqrt(frequency * frequency - damping * damping);
	const decay = Math.exp(-damping * time);
	const cos = Math.cos(omega * time);
	const sin = Math.sin(omega * time);
	return {
		position: decay * (position * cos + ((velocity + damping * position) / omega) * sin),
		velocity: decay * (velocity * cos - ((damping * velocity + frequency * frequency * position) / omega) * sin),
	};
}

const lineSpringSamples = new Map<number, Array<{ offset: number; fromPosition: number; fromVelocity: number }>>();
const lineSpringFrames = new Map<string, Array<{ offset: number; transform?: string; translate?: string }>>();

export function createLineSpringFrames(position: number, velocity: number, frequency = 10, propertyName: "transform" | "translate" = "transform"): Array<{ offset: number; transform?: string; translate?: string }> {
	const frameKey = `${position}:${velocity}:${frequency}:${propertyName}`;
	const cachedFrames = lineSpringFrames.get(frameKey);
	if (cachedFrames) return cachedFrames;
	let samples = lineSpringSamples.get(frequency);
	if (!samples) {
		samples = Array.from({ length: 97 }, (_, frame) => {
			const offset = frame / 96;
			const time = 1.2 * offset;
			return {
				offset,
				fromPosition: frame === 96 ? 0 : sampleSpring(1, 0, time, frequency).position,
				fromVelocity: frame === 96 ? 0 : sampleSpring(0, 1, time, frequency).position,
			};
		});
		lineSpringSamples.set(frequency, samples);
	}
	// A spring is linear in its starting position and velocity. Reuse the
	// two unit curves instead of repeating trigonometry for every moving row.
	const positions = samples.map(({ offset, fromPosition, fromVelocity }) => ({
		offset,
		y: position * fromPosition + velocity * fromVelocity,
	}));
	// Content containers already scale in CSS. Their layout correction must
	// compose with that scale rather than replace it during the spring.
	const frames = simplifyMotionSamples(positions, (sample) => [sample.y]).map(({ offset, y }) => (propertyName === "translate" ? { offset, translate: `0 ${y}px` } : { offset, transform: `translate3d(0, ${y}px, 0)` }));
	if (lineSpringFrames.size >= 64) {
		lineSpringFrames.delete(lineSpringFrames.keys().next().value!);
	}
	lineSpringFrames.set(frameKey, frames);
	return frames;
}
