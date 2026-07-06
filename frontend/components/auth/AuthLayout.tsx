// components/auth/AuthLayout.tsx
import { Radio } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Auth Forms */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="flex items-center space-x-3 mb-10">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Radio className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                RadioWave Admin
              </h2>
              <p className="text-sm text-gray-600">
                Station Management Dashboard
              </p>
            </div>
          </div>
          {children}
        </div>
      </div>

      {/* Right Side - Image/Illustration */}
      <div className="hidden lg:block relative w-0 flex-1">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                backgroundSize: "60px 60px",
              }}
            ></div>
          </div>

          <div className="relative h-full flex items-center justify-center p-12">
            <div className="max-w-2xl text-white">
              <div className="mb-12">
                <h1 className="text-5xl font-bold mb-6 leading-tight">
                  Manage Your Radio{" "}
                  <span className="text-blue-300">Station</span>
                </h1>
                <p className="text-xl opacity-90 leading-relaxed">
                  Professional dashboard for radio administrators to control
                  broadcasts, monitor listeners, and manage content seamlessly.
                </p>
              </div>

              {/* Features */}
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <span className="text-lg">📡</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Live Broadcasting</h3>
                    <p className="opacity-80">
                      Control live streams and scheduled content
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <span className="text-lg">📊</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">
                      Real-time Analytics
                    </h3>
                    <p className="opacity-80">
                      Monitor listener stats and engagement
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <span className="text-lg">👥</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Role Management</h3>
                    <p className="opacity-80">
                      Super Admin & Station Admin roles
                    </p>
                  </div>
                </div>
              </div>

              {/* Role Info */}
              <div className="mt-12 p-6 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
                <h3 className="text-xl font-bold mb-3">Role Differences</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-blue-300 mb-2">
                      Super Admin
                    </h4>
                    <ul className="text-sm space-y-1 opacity-90">
                      <li>• Full system access</li>
                      <li>• Manage all stations</li>
                      <li>• User management</li>
                      <li>• System settings</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-300 mb-2">Admin</h4>
                    <ul className="text-sm space-y-1 opacity-90">
                      <li>• Single station access</li>
                      <li>• Content management</li>
                      <li>• Schedule management</li>
                      <li>• Analytics view</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
