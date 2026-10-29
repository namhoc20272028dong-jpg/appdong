/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CompleteExamPackage, RuleAuditItem } from '../types/exam';
import { auditExamRegulations } from '../utils/examRules';
import { CheckCircle2, AlertTriangle, XCircle, Info, Wand2, X } from 'lucide-react';

interface AuditReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  examPkg: CompleteExamPackage;
  onApplyAutoFix: () => void;
}

export const AuditReportModal: React.FC<AuditReportModalProps> = ({
  isOpen,
  onClose,
  examPkg,
  onApplyAutoFix,
}) => {
  if (!isOpen) return null;

  const audits = auditExamRegulations(examPkg);
  const passedCount = audits.filter((a) => a.passed).length;
  const totalRules = audits.length;
  const hasErrors = audits.some((a) => !a.passed && a.severity === 'error');
  const allPassed = passedCount === totalRules;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${allPassed ? 'bg-emerald-100 text-emerald-700' : hasErrors ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
              {allPassed ? <CheckCircle2 className="w-5 h-5" /> : hasErrors ? <XCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Kiểm định quy chuẩn GDPT 2018 & Thông tư 27
              </h3>
              <p className="text-xs text-slate-500">
                Tuân thủ {passedCount}/{totalRules} tiêu chí sư phạm tiểu học
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-6 overflow-y-auto space-y-3.5 flex-1">
          {audits.map((item) => (
            <div
              key={item.ruleId}
              className={`p-3.5 rounded-xl border transition ${
                item.passed
                  ? 'bg-emerald-50/50 border-emerald-200'
                  : item.severity === 'error'
                  ? 'bg-red-50/60 border-red-200'
                  : 'bg-amber-50/60 border-amber-200'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 shrink-0">
                  {item.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : item.severity === 'error' ? (
                    <XCircle className="w-4 h-4 text-red-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold text-slate-800">{item.title}</h4>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        item.passed
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.severity === 'error'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.passed ? 'ĐẠT' : item.severity === 'error' ? 'CẦN SỬA' : 'LƯU Ý'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{item.description}</p>
                  {item.details && (
                    <div className="text-xs font-medium text-slate-700 mt-1.5 pt-1.5 border-t border-slate-200/60">
                      Chi tiết: {item.details}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <button
            onClick={onApplyAutoFix}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium flex items-center gap-2 shadow-xs transition"
          >
            <Wand2 className="w-4 h-4" />
            Tự động sắp xếp chuẩn quy chế (1-Click Auto-Fix)
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-sm font-medium transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
