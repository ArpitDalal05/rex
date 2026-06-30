'use client';

import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AccessDenied() {
  return (
    <div className="h-[75vh] w-full flex items-center justify-center p-4">
      <Card className="w-full max-w-md border shadow-sm bg-white">
        <CardHeader className="flex flex-col items-center pb-2 text-center">
          <div className="p-3 bg-red-50 text-red-500 rounded-full mb-3 dark:bg-red-950/20 dark:text-red-400">
            <Lock className="w-8 h-8 animate-bounce" />
          </div>
          <CardTitle className="text-xl font-bold tracking-tight text-slate-900">
            Access Restricted
          </CardTitle>
          <CardDescription className="text-sm text-slate-500 max-w-xs mt-1">
            You do not have the administrative privileges required to access this section.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-xs text-slate-400 pt-2 pb-6">
          This operation is logged and restricted to authorized shop managers only.
        </CardContent>
        <CardFooter className="flex justify-center border-t pt-4 bg-slate-50/50">
          <Link href="/" passHref className="w-full">
            <Button className="w-full gap-2 text-xs font-semibold" variant="outline">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
