import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import FilePreview from '@/components/ui/file-preview';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Image, Download } from 'lucide-react';

const FilePreviewDemo = () => {
  const navigate = useNavigate();
  
  // Sample documents for testing
  const sampleDocuments = [
    {
      id: 1,
      file_name: 'sample-passport.pdf',
      file_path: 'demo/passport/sample.pdf',
      file_size: 1024000, // 1MB
      mime_type: 'application/pdf',
      document_type: 'passport',
      status: 'pending',
      uploaded_at: '2024-01-15T10:30:00Z'
    },
    {
      id: 2,
      file_name: 'visa-document.jpg',
      file_path: 'demo/visa/sample.jpg',
      file_size: 512000, // 512KB
      mime_type: 'image/jpeg',
      document_type: 'visa',
      status: 'approved',
      uploaded_at: '2024-01-14T15:45:00Z'
    },
    {
      id: 3,
      file_name: 'ucas-statement.docx',
      file_path: 'demo/ucas/sample.docx',
      file_size: 2048000, // 2MB
      mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      document_type: 'ucas_statement',
      status: 'rejected',
      uploaded_at: '2024-01-13T09:20:00Z'
    }
  ];

  const handleDeleteDocument = (documentId: number) => {
    console.log('Delete document:', documentId);
    // In a real app, this would call the delete function
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              className="bg-white/80 backdrop-blur-md border-slate-200 hover:bg-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Modules
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">File Preview Demo</h1>
              <p className="text-slate-600">Test the file preview functionality with sample documents</p>
            </div>
          </div>
        </div>

        {/* Demo Info */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <FileText className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-slate-900">Demo Features</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Image className="w-4 h-4 text-green-600" />
                <span>Image preview (JPG, PNG)</span>
              </div>
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-red-600" />
                <span>PDF preview</span>
              </div>
              <div className="flex items-center space-x-2">
                <Download className="w-4 h-4 text-blue-600" />
                <span>Download functionality</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sample Documents */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">Sample Documents</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {sampleDocuments.map((document) => (
              <Card key={document.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="text-lg">{document.document_type.replace('_', ' ').toUpperCase()}</span>
                    <Badge className={
                      document.status === 'approved' ? 'bg-green-100 text-green-800' :
                      document.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }>
                      {document.status}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FilePreview
                    document={document}
                    onDelete={handleDeleteDocument}
                    showActions={true}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Features List */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>File Preview Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-900">Preview Capabilities</h3>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li>• Image files (JPG, PNG, WebP)</li>
                  <li>• PDF documents</li>
                  <li>• File type detection</li>
                  <li>• Responsive preview modal</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-900">Management Features</h3>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li>• Download files</li>
                  <li>• Delete documents</li>
                  <li>• Status tracking</li>
                  <li>• File size display</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Integration Info */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-6">
            <h3 className="font-semibold text-slate-900 mb-3">Integration Ready</h3>
            <p className="text-sm text-slate-600 mb-4">
              This file preview component is fully integrated with Supabase Storage and can be used throughout the application.
            </p>
            <div className="flex space-x-3">
              <Button 
                onClick={() => navigate('/application')}
                className="bg-green-600 hover:bg-green-700"
              >
                Test in Application Form
              </Button>
              <Button 
                onClick={() => navigate('/settings')}
                variant="outline"
              >
                View in Document Management
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FilePreviewDemo; 