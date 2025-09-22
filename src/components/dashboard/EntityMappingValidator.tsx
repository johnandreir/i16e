import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertTriangle, RefreshCw, Users, UserCheck, Building2 } from 'lucide-react';
import { useEntityDatabase } from '@/hooks/useEntityDatabase';

interface ValidationIssue {
    type: 'orphaned_squads' | 'orphaned_dpes' | 'empty_teams' | 'empty_squads';
    severity: 'warning' | 'error';
    count: number;
    entities: string[];
    description: string;
}

interface ValidationResults {
    valid: boolean;
    totalIssues: number;
    issues: ValidationIssue[];
    summary: {
        totalTeams: number;
        totalSquads: number;
        totalDPEs: number;
        orphanedSquads: number;
        orphanedDPEs: number;
        emptyTeams: number;
        emptySquads: number;
    };
}

interface EntityMappingValidatorProps {
    onValidationComplete?: (isValid: boolean) => void;
}

export const EntityMappingValidator: React.FC<EntityMappingValidatorProps> = ({
    onValidationComplete
}) => {
    const [validationResults, setValidationResults] = useState<ValidationResults | null>(null);
    const [isValidating, setIsValidating] = useState(false);
    const [lastValidation, setLastValidation] = useState<Date | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    const { getTeamsWithIds, getSquadsWithIds, getDPEsWithIds } = useEntityDatabase();

    const validateEntityMappings = async () => {
        setIsValidating(true);
        setError(null);

        try {
            // Fetch all entities
            const [teams, squads, dpes] = await Promise.all([
                getTeamsWithIds(),
                getSquadsWithIds(),
                getDPEsWithIds()
            ]);

            const issues: ValidationIssue[] = [];

            // Check for orphaned squads (squads without valid teams)
            const orphanedSquads = squads.filter(squad =>
                !teams.some(team => team._id === squad.teamId)
            );

            if (orphanedSquads.length > 0) {
                issues.push({
                    type: 'orphaned_squads',
                    severity: 'error',
                    count: orphanedSquads.length,
                    entities: orphanedSquads.map(s => s.name),
                    description: `Squad(s) are not mapped to any existing team`
                });
            }

            // Check for orphaned DPEs (DPEs without valid squads)
            const orphanedDPEs = dpes.filter(dpe =>
                !squads.some(squad => squad._id === dpe.squadId)
            );

            if (orphanedDPEs.length > 0) {
                issues.push({
                    type: 'orphaned_dpes',
                    severity: 'error',
                    count: orphanedDPEs.length,
                    entities: orphanedDPEs.map(d => d.name),
                    description: `DPE(s) are not mapped to any existing squad`
                });
            }

            // Check for teams without squads
            const emptyTeams = teams.filter(team =>
                !squads.some(squad => squad.teamId === team._id)
            );

            if (emptyTeams.length > 0) {
                issues.push({
                    type: 'empty_teams',
                    severity: 'warning',
                    count: emptyTeams.length,
                    entities: emptyTeams.map(t => t.name),
                    description: `Team(s) have no squads assigned`
                });
            }

            // Check for squads without DPEs
            const emptySquads = squads.filter(squad =>
                !dpes.some(dpe => dpe.squadId === squad._id)
            );

            if (emptySquads.length > 0) {
                issues.push({
                    type: 'empty_squads',
                    severity: 'warning',
                    count: emptySquads.length,
                    entities: emptySquads.map(s => s.name),
                    description: `Squad(s) have no DPEs assigned`
                });
            }

            const results: ValidationResults = {
                valid: issues.filter(i => i.severity === 'error').length === 0,
                totalIssues: issues.length,
                issues,
                summary: {
                    totalTeams: teams.length,
                    totalSquads: squads.length,
                    totalDPEs: dpes.length,
                    orphanedSquads: orphanedSquads.length,
                    orphanedDPEs: orphanedDPEs.length,
                    emptyTeams: emptyTeams.length,
                    emptySquads: emptySquads.length
                }
            };

            setValidationResults(results);
            setLastValidation(new Date());
            onValidationComplete?.(results.valid);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';
            setError(errorMessage);
            console.error('Entity mapping validation failed:', error);
        } finally {
            setIsValidating(false);
        }
    };

    useEffect(() => {
        // Run validation on component mount
        validateEntityMappings();
    }, []);

    const getIssueIcon = (type: ValidationIssue['type']) => {
        switch (type) {
            case 'orphaned_squads':
            case 'orphaned_dpes':
                return <AlertTriangle className="h-4 w-4 text-red-500" />;
            case 'empty_teams':
            case 'empty_squads':
                return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
            default:
                return <AlertTriangle className="h-4 w-4" />;
        }
    };

    const getSeverityColor = (severity: ValidationIssue['severity']) => {
        return severity === 'error' ? 'destructive' : 'secondary';
    };

    if (error) {
        return (
            <Card className="border-red-200">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="h-5 w-5" />
                        Entity Mapping Validation Error
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                    <div className="mt-4">
                        <Button onClick={validateEntityMappings} disabled={isValidating}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Retry Validation
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {validationResults?.valid ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                        )}
                        Entity Mapping Validation
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={validateEntityMappings}
                        disabled={isValidating}
                    >
                        {isValidating ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <RefreshCw className="h-4 w-4 mr-2" />
                        )}
                        Validate
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {isValidating ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <span className="ml-2">Validating entity relationships...</span>
                    </div>
                ) : validationResults ? (
                    <>
                        {/* Summary Statistics */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="text-center p-3 bg-blue-50 rounded-lg">
                                <Building2 className="h-6 w-6 mx-auto mb-1 text-blue-600" />
                                <div className="text-2xl font-bold text-blue-600">
                                    {validationResults.summary.totalTeams}
                                </div>
                                <div className="text-sm text-blue-600">Teams</div>
                            </div>
                            <div className="text-center p-3 bg-green-50 rounded-lg">
                                <Users className="h-6 w-6 mx-auto mb-1 text-green-600" />
                                <div className="text-2xl font-bold text-green-600">
                                    {validationResults.summary.totalSquads}
                                </div>
                                <div className="text-sm text-green-600">Squads</div>
                            </div>
                            <div className="text-center p-3 bg-purple-50 rounded-lg">
                                <UserCheck className="h-6 w-6 mx-auto mb-1 text-purple-600" />
                                <div className="text-2xl font-bold text-purple-600">
                                    {validationResults.summary.totalDPEs}
                                </div>
                                <div className="text-sm text-purple-600">DPEs</div>
                            </div>
                        </div>

                        {/* Validation Status */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                                <div className="font-medium">
                                    {validationResults.valid ? 'All Mappings Valid' : 'Mapping Issues Found'}
                                </div>
                                <div className="text-sm text-gray-600">
                                    {validationResults.totalIssues} issue(s) found
                                </div>
                            </div>
                            <Badge variant={validationResults.valid ? 'default' : 'destructive'}>
                                {validationResults.valid ? 'Valid' : 'Invalid'}
                            </Badge>
                        </div>

                        {/* Issues List */}
                        {validationResults.issues.length > 0 && (
                            <div className="space-y-3">
                                <h4 className="font-medium">Issues Found:</h4>
                                {validationResults.issues.map((issue, index) => (
                                    <Alert key={index} variant={issue.severity === 'error' ? 'destructive' : 'default'}>
                                        <div className="flex items-start gap-3">
                                            {getIssueIcon(issue.type)}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="font-medium">{issue.description}</span>
                                                    <Badge variant={getSeverityColor(issue.severity)}>
                                                        {issue.count} {issue.severity === 'error' ? 'error' : 'warning'}
                                                    </Badge>
                                                </div>
                                                <AlertDescription>
                                                    <div className="text-sm">
                                                        <strong>Affected entities:</strong>
                                                        <div className="mt-1 flex flex-wrap gap-1">
                                                            {issue.entities.slice(0, 5).map((entity, entityIndex) => (
                                                                <Badge key={entityIndex} variant="outline" className="text-xs">
                                                                    {entity}
                                                                </Badge>
                                                            ))}
                                                            {issue.entities.length > 5 && (
                                                                <Badge variant="outline" className="text-xs">
                                                                    +{issue.entities.length - 5} more
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </AlertDescription>
                                            </div>
                                        </div>
                                    </Alert>
                                ))}
                            </div>
                        )}

                        {/* Last Validation Time */}
                        {lastValidation && (
                            <div className="text-xs text-gray-500 text-center">
                                Last validated: {lastValidation.toLocaleString()}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        No validation data available
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default EntityMappingValidator;