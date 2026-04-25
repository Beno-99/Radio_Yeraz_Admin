import { useState } from "react";
import { Post } from "@/types";
import { PostCard } from "./PostCard";
import { Check } from "lucide-react";

interface PostsGridProps {
  posts: Post[];
  mediaUrl: string;
  onPostDeleted: () => void;
  onSelectionChange: (selectedIds: string[]) => void;
  loading: boolean;
  selectedPosts?: string[]; // Add this prop
}

export function PostsGrid({
  posts,
  mediaUrl,
  onPostDeleted,
  onSelectionChange,
  loading,
  selectedPosts = [], // Now using prop instead of local state
}: PostsGridProps) {
  // REMOVE local state - use the prop directly
  // const [selectedPosts, setSelectedPosts] = useState<string[]>([]); // DELETE THIS LINE

  // You already have this function - it's correct
  const isChecked = (postId: string) => selectedPosts.includes(postId);

  // This function is correct but you're not using it consistently
  const handleCheckboxChange = (postId: string, checked: boolean) => {
    let newSelection;
    if (checked) {
      newSelection = [...selectedPosts, postId];
    } else {
      newSelection = selectedPosts.filter((id) => id !== postId);
    }
    onSelectionChange(newSelection);
  };

  // FIX THIS FUNCTION - Use the handleCheckboxChange instead
  const handleSelectPost = (postId: string) => {
    // Use the existing logic
    const isCurrentlySelected = selectedPosts.includes(postId);
    handleCheckboxChange(postId, !isCurrentlySelected);

    // OLD CODE - REMOVE THIS:
    // const newSelected = selectedPosts.includes(postId)
    //   ? selectedPosts.filter((id) => id !== postId)
    //   : [...selectedPosts, postId];
    // setSelectedPosts(newSelected);
    // onSelectionChange?.(newSelected);
  };

  // FIX THIS FUNCTION TOO
  const handleSelectAll = () => {
    if (selectedPosts.length === posts.length) {
      // Clear all
      onSelectionChange([]);
    } else {
      // Select all
      const allIds = posts.map((post) => post._id);
      onSelectionChange(allIds);
    }

    // OLD CODE - REMOVE THIS:
    // if (selectedPosts.length === posts.length) {
    //   setSelectedPosts([]);
    //   onSelectionChange?.([]);
    // } else {
    //   const allIds = posts.map((post) => post._id);
    //   setSelectedPosts(allIds);
    //   onSelectionChange?.(allIds);
    // }
  };

  // The rest of your component is correct...
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="bg-white rounded-lg border border-gray-200 overflow-hidden animate-pulse"
          >
            <div className="h-48 bg-gray-200"></div>
            <div className="p-5 space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="flex gap-2 pt-4">
                <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
                <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
                <div className="h-8 w-8 bg-gray-200 rounded-lg ml-auto"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
        <div className="text-5xl mb-4">📭</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No posts found
        </h3>
        <p className="text-gray-500 max-w-md mx-auto">
          Create your first post to get started. Click the "Create Post" button
          above.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Selection Header */}
      {selectedPosts.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 bg-blue-600 rounded flex items-center justify-center">
              <Check className="w-4 h-4 text-white" />
            </div>
            <span className="font-medium text-blue-800">
              {selectedPosts.length} post{selectedPosts.length !== 1 ? "s" : ""}{" "}
              selected
            </span>
          </div>
          <button
            onClick={handleSelectAll}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            {selectedPosts.length === posts.length
              ? "Deselect all"
              : "Select all"}
          </button>
        </div>
      )}

      {/* Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {posts.map((post) => (
          <div key={post._id} className="relative">
            {/* Selection Checkbox */}
            <div className="absolute top-4 left-4 z-10">
              <button
                onClick={() => handleSelectPost(post._id)}
                className={`h-6 w-6 rounded border-2 flex items-center justify-center transition-all ${
                  selectedPosts.includes(post._id)
                    ? "bg-blue-600 border-blue-600"
                    : "bg-white border-gray-300 hover:border-blue-400"
                }`}
              >
                {selectedPosts.includes(post._id) && (
                  <Check className="w-4 h-4 text-white" />
                )}
              </button>
            </div>

            {/* Post Card */}
            <div
              className={
                selectedPosts.includes(post._id)
                  ? "ring-2 ring-blue-500 rounded-lg"
                  : ""
              }
            >
              <PostCard
                post={post}
                mediaUrl={mediaUrl}
                onDelete={onPostDeleted}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
