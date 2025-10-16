// src/components/auth/withAuth.tsx
"use client";

import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState, ComponentType } from 'react'; // 1. Import useState

const withAuth = <P extends object>(WrappedComponent: ComponentType<P>) => {
  const AuthComponent = (props: P) => {
    const router = useRouter();
    const { isAuthenticated } = useAuthStore();
    const [isClient, setIsClient] = useState(false); // 2. Add a state to track client-side mounting

    // 3. Set the state to true once the component mounts on the client
    useEffect(() => {
      setIsClient(true);
    }, []);

    // 4. Wrap the redirect logic in a useEffect that depends on the client-side state
    useEffect(() => {
      if (isClient && !isAuthenticated) {
        router.replace('/login');
      }
    }, [isAuthenticated, router, isClient]);

    // 5. Always render the loader on the server AND during the initial client render.
    // This ensures the server and client HTML match.
    if (!isClient || !isAuthenticated) {
      // You can replace this with a more visually appealing spinner component
      return <div>Loading...</div>; 
    }

    // 6. Render the actual component only after mounting and confirming authentication
    return <WrappedComponent {...props} />;
  };

  return AuthComponent;
};

export default withAuth;