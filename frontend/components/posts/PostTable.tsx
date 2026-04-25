interface PostTableProps {
  posts: any[];
}

export function PostTable({ posts }: PostTableProps) {
  return (
    <div className="mt-6 border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-3 text-left">Title</th>
            <th className="p-3">Status</th>
            <th className="p-3">Date</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => (
            <tr key={post.id} className="border-t">
              <td className="p-3">{post.title}</td>
              <td className="p-3 text-center">
                {post.published ? "Live" : "Draft"}
              </td>
              <td className="p-3 text-center">
                {new Date(post.createdAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
