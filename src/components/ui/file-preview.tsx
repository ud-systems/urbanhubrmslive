import React, { useState, useEffect } from 'react';
import { Button } from './button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './dialog';
import { Card, CardContent } from './card';
import { Badge } from './badge';
import { 
  FileText, 
  Image, 
  File, 
  Download, 
  Trash2, 
  Eye, 
  X,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { getDocumentUrl } from '@/lib/supabaseCrud';
import { useToast } from '@/hooks/use-toast';

interface FilePreviewProps {
  document: {
    id: number;
    file_name: string;
    file_path: string;
    file_size: number;
    mime_type: string;
    document_type: string;
    status: string;
    uploaded_at: string;
  };
  onDelete?: (documentId: number) => void;
  showActions?: boolean;
  className?: string;
}

const FilePreview: React.FC<FilePreviewProps> = ({
  document,
  onDelete,
  showActions = true,
  className = ""
}) => {
  const { toast } = useToast();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getFileIcon = () => {
    const extension = document.file_name.split('.').pop()?.toLowerCase();
    const mimeType = document.mime_type.toLowerCase();
    
    if (mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      return <Image className="w-5 h-5 text-blue-600" />;
    }
    if (mimeType === 'application/pdf' || extension === 'pdf') {
      return <FileText className="w-5 h-5 text-red-600" />;
    }
    if (mimeType.includes('word') || ['doc', 'docx'].includes(extension || '')) {
      return <FileText className="w-5 h-5 text-blue-600" />;
    }
    return <File className="w-5 h-5 text-slate-600" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const generatePreviewUrl = async () => {
    if (!document.file_path) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await getDocumentUrl(document.file_path, 3600); // 1 hour expiry
      if (result?.success) {
        setPreviewUrl(result.url);
      } else {
        throw new Error('Failed to generate preview URL');
      }
    } catch (err) {
      console.error('Error generating preview URL:', err);
      setError('Failed to load preview');
      toast({
        title: 'Error',
        description: 'Failed to load file preview',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreview = async () => {
    if (!previewUrl) {
      await generatePreviewUrl();
    }
    setIsPreviewOpen(true);
  };

  const handleDownload = async () => {
    if (!document.file_path) return;
    
    try {
      const result = await getDocumentUrl(document.file_path, 3600);
      if (result?.success) {
        const link = window.document.createElement('a');
        link.href = result.url;
        link.download = document.file_name;
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
        
        toast({
          title: 'Success',
          description: 'Download started'
        });
      }
    } catch (err) {
      console.error('Error downloading file:', err);
      toast({
        title: 'Error',
        description: 'Failed to download file',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(document.id);
    }
  };

  const canPreview = () => {
    const mimeType = document.mime_type.toLowerCase();
    return mimeType.startsWith('image/') || mimeType === 'application/pdf';
  };

  const renderPreviewContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      );
    }

    if (!previewUrl) {
      return (
        <div className="flex items-center justify-center h-64">
          <Button onClick={generatePreviewUrl} disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Load Preview'}
          </Button>
        </div>
      );
    }

    const mimeType = document.mime_type.toLowerCase();
    
    if (mimeType.startsWith('image/')) {
      return (
        <img 
          src={previewUrl} 
          alt={document.file_name}
          className="max-w-full max-h-96 object-contain mx-auto"
          onError={() => setError('Failed to load image')}
        />
      );
    }
    
    if (mimeType === 'application/pdf') {
      return (
        <iframe
          src={previewUrl}
          className="w-full h-96 border-0"
          title={document.file_name}
          onError={() => setError('Failed to load PDF')}
        />
      );
    }
    
    return (
      <div className="text-center py-8">
        <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
        <p className="text-slate-600 mb-4">Preview not available for this file type</p>
        <Button onClick={handleDownload}>
          <Download className="w-4 h-4 mr-2" />
          Download to View
        </Button>
      </div>
    );
  };

  return (
    <>
      <Card className={`hover:shadow-md transition-shadow ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {getFileIcon()}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {document.file_name}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs text-slate-500">
                    {formatFileSize(document.file_size)}
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <Badge variant="secondary" className="text-xs">
                    {document.document_type}
                  </Badge>
                  <span className="text-xs text-slate-400">•</span>
                  <Badge className={`text-xs ${getStatusColor(document.status)}`}>
                    {document.status}
                  </Badge>
                </div>
              </div>
            </div>
            
            {showActions && (
              <div className="flex items-center space-x-1">
                {canPreview() && (
                  <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handlePreview}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center justify-between">
                          <span>{document.file_name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsPreviewOpen(false)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </DialogTitle>
                      </DialogHeader>
                      <div className="mt-4">
                        {renderPreviewContent()}
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownload}
                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                >
                  <Download className="w-4 h-4" />
                </Button>
                
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDelete}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default FilePreview; 