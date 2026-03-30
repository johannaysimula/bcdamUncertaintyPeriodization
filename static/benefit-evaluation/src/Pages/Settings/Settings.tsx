import Button from '@atlaskit/button'
import React, { Fragment, useState, useRef } from 'react'
import { useNavigate } from 'react-router'
import { SetIssueType } from '../../Components/SettingsComponents/SetIssueType'
import { Inline, Stack } from '@atlaskit/primitives'
import {
    ScopeTypeEnum,
    ScopeType,
    useAppContext,
} from '../../Contexts/AppContext'
import { useAPI } from '../../Contexts/ApiContext'
import { useAlert } from '../../Contexts/AlertContext'
import { SetIssueStatuses } from '../../Components/SettingsComponents/SetIssueStatuses'
import { ResetProject } from '../../Components/SettingsComponents/ResetProject'
import { DisconnectProject } from '../../Components/SettingsComponents/DisconnectProject'
import { ResetEverything } from '../../Components/SettingsComponents/ResetEverything'
import { DeletePortfolio } from '../../Components/SettingsComponents/DeletePortfolio'
import PageHeader from '@atlaskit/page-header'
import { importApi } from '../../Api/ImportApi'

export const Settings = () => {
    const [scope] = useAppContext()
    const navigate = useNavigate()
    const [isImporting, setIsImporting] = useState(false)
    const [importStatus, setImportStatus] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setIsImporting(true)
        setImportStatus(null)
        try {
            const text = await file.text()
            const data = JSON.parse(text)
            const result = await importApi().importData(scope.id, data)
            setImportStatus(result.ok ? 'Import successful! Refresh to see the data.' : 'Import failed.')
        } catch (err) {
            setImportStatus('Error reading file or importing data.')
        } finally {
            setIsImporting(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    return (
        <>
            <PageHeader>Settings</PageHeader>
            <div
                style={{
                    marginTop: '1rem',
                    maxWidth: '400px',
                    display: 'grid',
                    gap: '1rem',
                }}
            >
                <Stack space="space.200">
                    {scope.type === ScopeTypeEnum.PROJECT ? (
                        <>
                            <SetIssueType />
                            <SetIssueStatuses />
                            <DisconnectProject />
                            <ResetProject />
                        </>
                    ) : (
                        <>
                            <Inline space="space.300" spread="space-between">
                                <h4>Edit Portfolio</h4>
                                <Button
                                    onClick={() => navigate('edit-portfolio')}
                                >
                                    Edit
                                </Button>
                            </Inline>
                            <DeletePortfolio />
                        </>
                    )}
                    <ResetEverything />
                    <div>
                        <Inline space="space.300" spread="space-between">
                            <h4>Import Goal Data</h4>
                            <Button
                                isDisabled={isImporting}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {isImporting ? 'Importing...' : 'Import from file'}
                            </Button>
                        </Inline>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".json"
                            style={{ display: 'none' }}
                            onChange={handleImport}
                        />
                        {importStatus && (
                            <p style={{ color: importStatus.startsWith('Import successful') ? 'green' : 'red', marginTop: '0.5rem' }}>
                                {importStatus}
                            </p>
                        )}
                    </div>
                </Stack>
            </div>
        </>
    )
}
