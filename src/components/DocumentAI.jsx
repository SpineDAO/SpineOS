import React, { useState, useCallback, useRef } from 'react'
import { cptCodes } from '../data/seedData'

export default function DocumentAI({ addCase, addTrainingSignal, cases }) {
  const [uploads, setUploads] = useState([])
  const [processing, setProcessing] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [extractedData, setExtractedData] = useState(null)
  const fileInputRef = useRef(null)
  const dropRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFiles = useCallback(async (files) => {
    const newUploads = []
    for (const file of Array.from(files)) {
      const upload = {
        id: `DOC-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        name: file.name,
        type: file.type,
        size: file.size,
        uploadDate: new Date().toISOString(),
        status: 'uploaded',
        category: categorizeFile(file),
        extractedData: null,
        versions: [{ version: 1, date: new Date().toISOString(), action: 'uploaded' }],
      }

      // Read file content
      if (file.type.includes('text') || file.name.endsWith('.txt') || file.name.endsWith('.csv')) {
        upload.content = await file.text()
      } else if (file.type.includes('image')) {
        upload.content = await fileToBase64(file)
        upload.isImage = true
      } else {
        upload.content = `[${file.type || 'Binary'} file: ${file.name}, ${(file.size / 1024).toFixed(1)} KB]`
      }

      newUploads.push(upload)
    }
    setUploads(prev => [...prev, ...newUploads])
  }, [])

  const processDocument = useCallback(async (doc) => {
    setProcessing(true)
    setSelectedDoc(doc)

    // Simulate AI processing
    await new Promise(r => setTimeout(r, 2000))

    let extracted = null

    if (doc.category === 'operative_report') {
      extracted = {
        type: 'operative_report',
        procedureDetails: {
          procedure: 'Extracted from document analysis',
          surgeon: 'Dr. Sarah Chen',
          date: new Date().toISOString().split('T')[0],
          levels: ['L4-L5'],
          approach: 'posterior',
          diagnosis: 'Lumbar spinal stenosis with neurogenic claudication',
        },
        suggestedCPT: [
          { code: '63047', description: 'Laminectomy, facetectomy, foraminotomy, lumbar', wRVU: 13.18, confidence: 92 },
          { code: '63048', description: 'Each additional segment', wRVU: 3.79, confidence: 85 },
        ],
        suggestedICD10: [
          { code: 'M48.06', description: 'Spinal stenosis, lumbar', confidence: 94 },
        ],
        missingElements: [
          'No mention of decompression extent in millimeters',
          'Conservative care history not documented in this note',
          'Implant details (manufacturer, size) not specified',
        ],
        completenessScore: 72,
      }
    } else if (doc.category === 'excel_caselog') {
      extracted = {
        type: 'excel_caselog',
        casesFound: 15,
        dateRange: 'Jan 2026 - Feb 2026',
        totalWRVU: 487.3,
        cptValidation: {
          valid: 12,
          invalid: 2,
          missing: 1,
          corrections: [
            { row: 5, original: '22613', suggested: '22612', reason: '22613 is not a valid CPT code — likely meant 22612' },
            { row: 11, original: '63046', suggested: '63047', reason: 'Based on procedure description, 63047 (lumbar) is more appropriate than 63046 (thoracic)' },
          ],
        },
        wrvuSummary: {
          byMonth: [
            { month: 'Jan 2026', wRVU: 265.1, cases: 8 },
            { month: 'Feb 2026', wRVU: 222.2, cases: 7 },
          ],
          byPayer: [
            { payer: 'Medicare', wRVU: 198.4, cases: 6 },
            { payer: 'BCBS', wRVU: 155.2, cases: 5 },
            { payer: 'Aetna', wRVU: 133.7, cases: 4 },
          ],
        },
      }
    } else if (doc.category === 'radiology') {
      extracted = {
        type: 'radiology',
        findings: {
          diagnosis: 'Multi-level lumbar degenerative disc disease with stenosis',
          levels: ['L3-L4', 'L4-L5', 'L5-S1'],
          severity: {
            'L3-L4': 'Mild central stenosis, moderate foraminal stenosis bilaterally',
            'L4-L5': 'Severe central stenosis, Grade I spondylolisthesis, bilateral foraminal stenosis',
            'L5-S1': 'Moderate disc bulge with mild right foraminal stenosis',
          },
        },
        suggestedICD10: [
          { code: 'M48.06', description: 'Spinal stenosis, lumbar', confidence: 95 },
          { code: 'M43.16', description: 'Spondylolisthesis, lumbar', confidence: 92 },
          { code: 'M51.16', description: 'Disc degeneration, lumbar', confidence: 88 },
        ],
        surgicalIndicationStrength: 'Strong',
        surgicalIndicationDetails: 'Severe stenosis at L4-L5 with spondylolisthesis supports surgical decompression and fusion. MRI findings correlate with clinical symptoms.',
      }
    } else if (doc.isImage) {
      extracted = {
        type: 'intraoperative_image',
        implantIdentification: {
          type: 'Pedicle screw and rod construct',
          manufacturer: 'Detected: Medtronic CD Horizon Solera',
          components: ['6.5mm x 50mm pedicle screws (bilateral L4)', '7.0mm x 55mm pedicle screws (bilateral L5)', '5.5mm titanium rods'],
          cptAlignment: [
            { code: '22842', description: 'Posterior segmental instrumentation, 3-6 segments', aligned: true },
          ],
        },
      }
    } else {
      extracted = {
        type: 'other',
        summary: 'Document processed. Content extracted for review.',
        wordCount: doc.content?.length || 0,
      }
    }

    // Update upload with extracted data
    setUploads(prev => prev.map(u =>
      u.id === doc.id ? {
        ...u,
        status: 'processed',
        extractedData: extracted,
        versions: [...u.versions, { version: u.versions.length + 1, date: new Date().toISOString(), action: 'processed' }]
      } : u
    ))
    setExtractedData(extracted)
    setProcessing(false)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-white">Document AI</h1>
        <p className="text-sm text-spine-muted mt-1">Multi-modal document processing and intelligence extraction</p>
      </div>

      {/* Upload Zone */}
      <div
        ref={dropRef}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`glass-card rounded-xl p-8 text-center border-2 border-dashed transition-all cursor-pointer ${
          dragOver ? 'border-spine-accent bg-spine-accent/5' : 'border-spine-border hover:border-spine-accent/50'
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.doc,.txt,.xlsx,.xls,.csv,.png,.jpg,.jpeg,.gif"
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
        />
        <svg className="w-12 h-12 mx-auto mb-3 text-spine-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        <p className="text-sm text-spine-text mb-1">Drop files here or click to upload</p>
        <p className="text-xs text-spine-muted">Supports: PDF, DOCX, Excel, Images (Op reports, radiology, implant photos, case logs)</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document List */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-white">Uploaded Documents ({uploads.length})</h3>
          {uploads.length === 0 && (
            <div className="glass-card rounded-xl p-4 text-center">
              <p className="text-xs text-spine-muted">No documents uploaded yet</p>
            </div>
          )}
          {uploads.map(doc => (
            <button
              key={doc.id}
              onClick={() => { setSelectedDoc(doc); setExtractedData(doc.extractedData) }}
              className={`w-full glass-card rounded-xl p-4 text-left transition-all hover:border-spine-accent/30 ${
                selectedDoc?.id === doc.id ? 'border-spine-accent/50 bg-spine-accent/5' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">
                    {doc.category === 'operative_report' ? '📋' :
                     doc.category === 'radiology' ? '🔬' :
                     doc.category === 'excel_caselog' ? '📊' :
                     doc.isImage ? '📷' : '📄'}
                  </span>
                  <div>
                    <p className="text-xs font-medium text-white truncate max-w-[160px]">{doc.name}</p>
                    <p className="text-[10px] text-spine-muted capitalize">{doc.category.replace('_', ' ')}</p>
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                  doc.status === 'processed' ? 'bg-spine-green/20 text-spine-green' : 'bg-spine-gold/20 text-spine-gold'
                }`}>
                  {doc.status}
                </span>
              </div>
              {doc.status === 'uploaded' && (
                <button
                  onClick={(e) => { e.stopPropagation(); processDocument(doc) }}
                  className="mt-2 w-full py-1.5 text-[10px] accent-gradient text-white rounded-lg hover:opacity-90"
                >
                  Process with AI
                </button>
              )}
              {/* Version history */}
              <div className="mt-2 space-y-0.5">
                {doc.versions.map((v, i) => (
                  <p key={i} className="text-[9px] text-spine-muted">
                    v{v.version} - {v.action} - {new Date(v.date).toLocaleTimeString()}
                  </p>
                ))}
              </div>
            </button>
          ))}
        </div>

        {/* Extraction Results */}
        <div className="lg:col-span-2 space-y-4">
          {processing && (
            <div className="glass-card rounded-xl p-8 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-spine-accent border-t-transparent rounded-full mx-auto mb-3"/>
              <p className="text-sm text-spine-text">Processing document with AI...</p>
              <p className="text-xs text-spine-muted mt-1">Extracting procedures, codes, and clinical data</p>
            </div>
          )}

          {!processing && !extractedData && (
            <div className="glass-card rounded-xl p-8 text-center">
              <p className="text-sm text-spine-muted">Upload and process a document to see extraction results</p>
            </div>
          )}

          {!processing && extractedData?.type === 'operative_report' && (
            <div className="space-y-4 animate-fade-in">
              <div className="glass-card rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-white">Operative Report Extraction</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-spine-muted">Completeness</span>
                    <div className="w-20 h-2 bg-spine-bg rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${extractedData.completenessScore > 80 ? 'bg-spine-green' : extractedData.completenessScore > 60 ? 'bg-spine-gold' : 'bg-spine-red'}`} style={{ width: `${extractedData.completenessScore}%` }} />
                    </div>
                    <span className="text-xs font-mono text-white">{extractedData.completenessScore}%</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-spine-bg/50">
                    <p className="text-[10px] text-spine-muted uppercase">Procedure</p>
                    <p className="text-xs text-white mt-1">{extractedData.procedureDetails.procedure}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-spine-bg/50">
                    <p className="text-[10px] text-spine-muted uppercase">Levels</p>
                    <p className="text-xs text-white mt-1">{extractedData.procedureDetails.levels.join(', ')}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-spine-bg/50">
                    <p className="text-[10px] text-spine-muted uppercase">Approach</p>
                    <p className="text-xs text-white mt-1 capitalize">{extractedData.procedureDetails.approach}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-spine-bg/50">
                    <p className="text-[10px] text-spine-muted uppercase">Diagnosis</p>
                    <p className="text-xs text-white mt-1">{extractedData.procedureDetails.diagnosis}</p>
                  </div>
                </div>
              </div>

              <div className="glass-card rounded-xl p-5">
                <h4 className="text-xs font-semibold text-spine-accent mb-3">Suggested CPT Codes</h4>
                <div className="space-y-2">
                  {extractedData.suggestedCPT.map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-spine-bg/50">
                      <div>
                        <span className="text-sm font-mono text-spine-accent">{c.code}</span>
                        <span className="text-xs text-spine-text ml-2">{c.description}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-spine-gold">{c.wRVU} wRVU</span>
                        <span className="text-[10px] text-spine-green">{c.confidence}% conf</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {extractedData.missingElements.length > 0 && (
                <div className="glass-card rounded-xl p-5 border-l-4 border-spine-gold">
                  <h4 className="text-xs font-semibold text-spine-gold mb-3">Missing Documentation Elements</h4>
                  <ul className="space-y-1.5">
                    {extractedData.missingElements.map((el, i) => (
                      <li key={i} className="text-xs text-spine-text flex items-start gap-2">
                        <svg className="w-3 h-3 text-spine-gold mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        {el}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {!processing && extractedData?.type === 'excel_caselog' && (
            <div className="space-y-4 animate-fade-in">
              <div className="glass-card rounded-xl p-5">
                <h3 className="text-sm font-semibold text-white mb-3">Case Log Analysis</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-spine-bg/50 text-center">
                    <p className="text-lg font-bold text-spine-accent font-mono">{extractedData.casesFound}</p>
                    <p className="text-[10px] text-spine-muted">Cases Found</p>
                  </div>
                  <div className="p-3 rounded-lg bg-spine-bg/50 text-center">
                    <p className="text-lg font-bold text-spine-gold font-mono">{extractedData.totalWRVU}</p>
                    <p className="text-[10px] text-spine-muted">Total wRVU</p>
                  </div>
                  <div className="p-3 rounded-lg bg-spine-bg/50 text-center">
                    <p className="text-lg font-bold text-spine-green font-mono">{extractedData.cptValidation.valid}</p>
                    <p className="text-[10px] text-spine-muted">Valid Codes</p>
                  </div>
                </div>
              </div>

              {extractedData.cptValidation.corrections.length > 0 && (
                <div className="glass-card rounded-xl p-5 border-l-4 border-spine-red">
                  <h4 className="text-xs font-semibold text-spine-red mb-3">CPT Code Corrections Needed</h4>
                  {extractedData.cptValidation.corrections.map((c, i) => (
                    <div key={i} className="p-3 rounded-lg bg-spine-bg/50 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-spine-muted">Row {c.row}:</span>
                        <span className="text-xs font-mono text-spine-red line-through">{c.original}</span>
                        <svg className="w-3 h-3 text-spine-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                        <span className="text-xs font-mono text-spine-green">{c.suggested}</span>
                      </div>
                      <p className="text-[10px] text-spine-muted mt-1">{c.reason}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="glass-card rounded-xl p-5">
                <h4 className="text-xs font-semibold text-white mb-3">wRVU Summary by Payer</h4>
                <div className="space-y-2">
                  {extractedData.wrvuSummary.byPayer.map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded bg-spine-bg/50">
                      <span className="text-xs text-spine-text">{p.payer}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-spine-muted">{p.cases} cases</span>
                        <span className="text-xs font-mono text-spine-gold">{p.wRVU} wRVU</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {!processing && extractedData?.type === 'radiology' && (
            <div className="space-y-4 animate-fade-in">
              <div className="glass-card rounded-xl p-5">
                <h3 className="text-sm font-semibold text-white mb-3">Radiology Report Analysis</h3>
                <p className="text-xs text-spine-text mb-3">{extractedData.findings.diagnosis}</p>
                <div className="space-y-2">
                  {Object.entries(extractedData.findings.severity).map(([level, desc]) => (
                    <div key={level} className="p-3 rounded-lg bg-spine-bg/50">
                      <span className="text-xs font-mono text-spine-accent font-bold">{level}</span>
                      <p className="text-xs text-spine-text mt-0.5">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-card rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-semibold text-spine-green">Surgical Indication Assessment</h4>
                  <span className={`text-xs px-3 py-1 rounded-full ${
                    extractedData.surgicalIndicationStrength === 'Strong' ? 'bg-spine-green/20 text-spine-green' : 'bg-spine-gold/20 text-spine-gold'
                  }`}>
                    {extractedData.surgicalIndicationStrength}
                  </span>
                </div>
                <p className="text-xs text-spine-text">{extractedData.surgicalIndicationDetails}</p>
              </div>

              <div className="glass-card rounded-xl p-5">
                <h4 className="text-xs font-semibold text-spine-accent mb-3">Suggested ICD-10 Codes</h4>
                <div className="space-y-2">
                  {extractedData.suggestedICD10.map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded bg-spine-bg/50">
                      <div>
                        <span className="text-xs font-mono text-spine-green">{c.code}</span>
                        <span className="text-xs text-spine-text ml-2">{c.description}</span>
                      </div>
                      <span className="text-[10px] text-spine-muted">{c.confidence}% match</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {!processing && extractedData?.type === 'intraoperative_image' && (
            <div className="space-y-4 animate-fade-in">
              <div className="glass-card rounded-xl p-5">
                <h3 className="text-sm font-semibold text-white mb-3">Implant Identification</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-spine-bg/50">
                    <p className="text-[10px] text-spine-muted uppercase">Implant Type</p>
                    <p className="text-xs text-white mt-1">{extractedData.implantIdentification.type}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-spine-bg/50">
                    <p className="text-[10px] text-spine-muted uppercase">Manufacturer</p>
                    <p className="text-xs text-white mt-1">{extractedData.implantIdentification.manufacturer}</p>
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-[10px] text-spine-muted uppercase mb-2">Components Identified</p>
                  {extractedData.implantIdentification.components.map((c, i) => (
                    <p key={i} className="text-xs text-spine-text mb-1">- {c}</p>
                  ))}
                </div>
                <div className="mt-3">
                  <p className="text-[10px] text-spine-muted uppercase mb-2">CPT Alignment</p>
                  {extractedData.implantIdentification.cptAlignment.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded bg-spine-bg/50">
                      <span className="text-xs font-mono text-spine-accent">{c.code}</span>
                      <span className="text-xs text-spine-text">{c.description}</span>
                      <span className={`text-[10px] ml-auto ${c.aligned ? 'text-spine-green' : 'text-spine-red'}`}>
                        {c.aligned ? 'Aligned' : 'Mismatch'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function categorizeFile(file) {
  const name = file.name.toLowerCase()
  if (name.includes('op') || name.includes('operative') || name.includes('report') || name.includes('note')) return 'operative_report'
  if (name.includes('rad') || name.includes('mri') || name.includes('ct') || name.includes('xray')) return 'radiology'
  if (name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.csv') || name.includes('case') || name.includes('log')) return 'excel_caselog'
  if (file.type.includes('image')) return 'intraoperative_image'
  return 'operative_report'
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
