import { baseAuthUrl } from '../../store';
import type { Generation } from '../../types/generation';
import type { Powertrain } from '../../stores/powertrainStore';
import type { Specification } from '../../stores/specificationStore';
import type { Trim } from '../../stores/trimsStore';
import type { CompareSideSelection } from '../../types/compare';
import { fetchAllPages } from '../paginatedFetch';
import { resolveImageUrl } from '../../components/generations/utils';
import type { GenerationImage } from '../../types/generation';

export type CompareGenerationBlock = {
    generation: Generation;
    imageUrls: string[];
    specifications: Specification[];
    powertrains: Powertrain[];
};

export type CompareSideData = {
    selection: CompareSideSelection;
    title: string;
    blocks: CompareGenerationBlock[];
};

async function loadImagesForGeneration(generationId: string): Promise<string[]> {
    const images = await fetchAllPages<GenerationImage>(
        `${baseAuthUrl}/generation-images`,
        { filter: { generationId } },
    );
    return images
        .map((img) => resolveImageUrl(img.imageUrl))
        .filter((u): u is string => Boolean(u));
}

async function loadGenerationBlock(
    generation: Generation,
    powertrainId?: string,
): Promise<CompareGenerationBlock> {
    const [specifications, powertrains, imageUrls] = await Promise.all([
        fetchAllPages<Specification>(`${baseAuthUrl}/specifications`, {
            filter: { generationId: generation.id },
        }),
        fetchAllPages<Powertrain>(`${baseAuthUrl}/powertrains`, {
            filter: { generationId: generation.id },
        }),
        loadImagesForGeneration(generation.id),
    ]);

    const visibleSpecs = specifications.filter((s) => !s.isHidden);
    let visiblePt = powertrains.filter((p) => !p.isHidden);
    if (powertrainId) {
        visiblePt = visiblePt.filter((p) => p.id === powertrainId);
    }

    return {
        generation,
        imageUrls,
        specifications: visibleSpecs,
        powertrains: visiblePt,
    };
}

export async function loadCompareSideData(
    selection: CompareSideSelection,
): Promise<CompareSideData> {
    const title = [selection.brandName, selection.modelName].filter(Boolean).join(' · ');

    let generations: Generation[];
    if (selection.generationId) {
        const gen = await fetchAllPages<Generation>(`${baseAuthUrl}/generations`, {
            modelId: selection.modelId,
        });
        const one = gen.find((g) => g.id === selection.generationId);
        generations = one ? [one] : [];
    } else {
        generations = (
            await fetchAllPages<Generation>(`${baseAuthUrl}/generations`, {
                modelId: selection.modelId,
            })
        ).sort((a, b) => (a.number ?? 0) - (b.number ?? 0));
    }

    const blocks = await Promise.all(
        generations.map((g) => loadGenerationBlock(g, selection.powertrainId)),
    );

    return { selection, title, blocks };
}
