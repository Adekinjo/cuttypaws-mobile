import MixedFeed from "../post/MixedFeed";

export default function Home({
  onNavigate,
  onOpenCreatePost,
  onOpenAiHelp,
  onOpenEditPost,
  onOpenPost,
  onOpenProduct,
  onOpenService,
  embedded = false,
}: {
  onNavigate?: (route: string, params?: Record<string, any>) => void;
  onOpenCreatePost?: () => void;
  onOpenAiHelp?: () => void;
  onOpenEditPost?: (postId: string | number) => void;
  onOpenPost?: (post: any) => void;
  onOpenProduct?: (product: any) => void;
  onOpenService?: (serviceAd: any) => void;
  embedded?: boolean;
}) {
  return (
    <MixedFeed
      embedded={embedded}
      onNavigate={onNavigate}
      onOpenCreatePost={onOpenCreatePost}
      onOpenAiHelp={onOpenAiHelp}
      onOpenEditPost={onOpenEditPost}
      onOpenPost={onOpenPost}
      onOpenProduct={onOpenProduct}
      onOpenService={onOpenService}
    />
  );
}
