// src/components/Features/ExcelImport.js
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileSpreadsheet, Download, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import Button from '../UI/Button';
import Card from '../UI/Card';
import Modal from '../UI/Modal';
import FileUpload from '../UI/FileUpload';
import api from '../../services/api';

const ExcelImport = ({ type = 'expenses', onImportComplete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleImport = async () => {
    if (!selectedFile) return;

    setImporting(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await api.post(`/${type}/import`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setResult(response.data);
      if (onImportComplete) onImportComplete();
    } catch (error) {
      setResult({
        imported: 0,
        errors: 1,
        message: error.response?.data?.message || 'Import failed'
      });
    } finally {
      setImporting(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await api.get(`/${type}/export`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Export failed');
    }
  };

  const resetModal = () => {
    setSelectedFile(null);
    setResult(null);
    setIsModalOpen(false);
  };

  return (
    <>
      <Card className="p-4" shadow="shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-secondary-50 text-secondary-600 rounded-lg">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 leading-none">Excel Import/Export</h3>
              <p className="text-xs text-slate-500 mt-1">Manage {type} data via spreadsheets</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={Download}
              onClick={handleExport}
            >
              Export
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Upload}
              onClick={() => setIsModalOpen(true)}
            >
              Import
            </Button>
          </div>
        </div>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={resetModal}
        title={`Import ${type.charAt(0).toUpperCase() + type.slice(1)} from Excel`}
        size="lg"
      >
        <div className="space-y-6">
          {!result ? (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Excel Format Requirements</h4>
                    <div className="mt-2 text-sm text-blue-700">
                      <p className="mb-2">Your Excel file should have these columns:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {type === 'expenses' ? (
                          <>
                            <li><strong>Date</strong> - Date of expense (YYYY-MM-DD)</li>
                            <li><strong>Amount</strong> - Expense amount (number)</li>
                            <li><strong>Category</strong> - Expense category (required)</li>
                            <li><strong>Recipient</strong> - Who received payment (optional)</li>
                            <li><strong>Payment Method</strong> - How payment was made (optional)</li>
                            <li><strong>Notes</strong> - Additional notes (optional)</li>
                          </>
                        ) : (
                          <>
                            <li><strong>Date</strong> - Date of income (YYYY-MM-DD)</li>
                            <li><strong>Source</strong> - Income source (required)</li>
                            <li><strong>Amount</strong> - Income amount (number)</li>
                            <li><strong>Payment Method</strong> - How payment was received (optional)</li>
                            <li><strong>Notes</strong> - Additional notes (optional)</li>
                            <li><strong>Recurring</strong> - Is this recurring? (true/false)</li>
                          </>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <FileUpload
                onFileSelect={setSelectedFile}
                accept=".xlsx,.xls"
                label="Select Excel File"
                maxSize={5 * 1024 * 1024} // 5MB
              />

              <div className="flex justify-end space-x-3">
                <Button variant="secondary" onClick={resetModal}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleImport}
                  disabled={!selectedFile}
                  loading={importing}
                >
                  Import Data
                </Button>
              </div>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-4"
            >
              {result.imported > 0 ? (
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              ) : (
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
              )}
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Import {result.imported > 0 ? 'Completed' : 'Failed'}
                </h3>
                <p className="text-gray-600">{result.message}</p>
              </div>

              {result.imported > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-sm text-green-700">
                    <p><strong>Successfully imported:</strong> {result.imported} records</p>
                    {result.errors > 0 && (
                      <p><strong>Errors:</strong> {result.errors} records failed</p>
                    )}
                  </div>
                </div>
              )}

              {result.errorDetails && result.errorDetails.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-40 overflow-y-auto">
                  <h4 className="font-medium text-red-900 mb-2">Error Details:</h4>
                  <div className="text-sm text-red-700 space-y-1">
                    {result.errorDetails.map((error, index) => (
                      <p key={index}>Row {error.row}: {error.error}</p>
                    ))}
                  </div>
                </div>
              )}

              <Button variant="primary" onClick={resetModal}>
                Close
              </Button>
            </motion.div>
          )}
        </div>
      </Modal>
    </>
  );
};

export default ExcelImport;
