import { HeadType } from '@atlaskit/dynamic-table/dist/types/types'
import { GoalTier, GoalTierTypeEnum } from '../../Models/GoalTierModel'

export const GoalTableHead = (goalTier: GoalTier): HeadType | undefined => {
    return {
        cells: [
            {
                key: 'name',
                content: 'Name',
                isSortable: true,
            },
            {
                key: 'description',
                content: 'Description',
                isSortable: true,
                shouldTruncate: true,
            },
            {
                key: 'balancedPoints',
                content: (
                    <span style={{ display: 'block', textAlign: 'right' }}>
                        {goalTier.type === GoalTierTypeEnum.ISSUE_TYPE
                            ? 'Benefit Points'
                            : goalTier.type === GoalTierTypeEnum.PORTFOLIO_ITEM
                            ? 'Portfolio Item Points'
                            : 'Weight'}
                    </span>
                ),
                isSortable: true,
            },
            ...(goalTier.type === GoalTierTypeEnum.ISSUE_TYPE
                ? [
                      {
                          key: 'cost',
                          content: <span style={{ display: 'block', textAlign: 'right' }}>Cost Points</span>,
                          isSortable: true,
                      },
                      {
                          key: 'time',
                          content: <span style={{ display: 'block', textAlign: 'right' }}>Time Points</span>,
                          isSortable: true,
                      },
                      {
                          key: 'status',
                          content: 'Status',
                          isSortable: true,
                      },
                  ]
                : []),
            ...(goalTier.type === GoalTierTypeEnum.PORTFOLIO_ITEM
                ? [
                      {
                          key: 'type',
                          content: 'Type',
                          isSortable: true,
                      },
                  ]
                : []),
            ...(goalTier.type !== GoalTierTypeEnum.ISSUE_TYPE
                ? [
                      {
                          key: 'action',
                          content: 'Action',
                          isSortable: false,
                      },
                  ]
                : []),
        ],
    }
}
