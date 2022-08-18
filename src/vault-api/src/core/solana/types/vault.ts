export type Vault = {
  version: '0.1.0';
  name: 'vault';
  instructions: [
    {
      name: 'createProfile';
      accounts: [
        {
          name: 'profile';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'profileData';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
        },
      ];
      args: [];
    },
    {
      name: 'createProfileDocument';
      accounts: [
        {
          name: 'profile';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'document';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'profileData';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
        },
      ];
      args: [
        {
          name: 'name';
          type: 'string';
        },
      ];
    },
    {
      name: 'deleteProfileDocument';
      accounts: [
        {
          name: 'profile';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'document';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'profileData';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
        },
      ];
      args: [
        {
          name: 'documentIndex';
          type: 'u64';
        },
      ];
    },
    {
      name: 'createProfileDocumentShare';
      accounts: [
        {
          name: 'profile';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'documentShare';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'document';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
        },
      ];
      args: [
        {
          name: 'documentIndex';
          type: 'u64';
        },
        {
          name: 'invitee';
          type: 'publicKey';
        },
        {
          name: 'validUntil';
          type: 'i64';
        },
      ];
    },
    {
      name: 'toggleProfileDocumentShare';
      accounts: [
        {
          name: 'profile';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'documentShare';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'document';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
        },
      ];
      args: [
        {
          name: 'documentIndex';
          type: 'u64';
        },
        {
          name: 'invitee';
          type: 'publicKey';
        },
      ];
    },
  ];
  accounts: [
    {
      name: 'profileData';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'profile';
            type: 'publicKey';
          },
          {
            name: 'documentCount';
            type: 'u64';
          },
          {
            name: 'created';
            type: 'i64';
          },
          {
            name: 'updated';
            type: 'i64';
          },
        ];
      };
    },
    {
      name: 'documentData';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'profile';
            type: 'publicKey';
          },
          {
            name: 'name';
            type: 'string';
          },
          {
            name: 'index';
            type: 'u64';
          },
          {
            name: 'created';
            type: 'i64';
          },
          {
            name: 'deleted';
            type: 'bool';
          },
        ];
      };
    },
    {
      name: 'documentShareData';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'invitee';
            type: 'publicKey';
          },
          {
            name: 'documentIndex';
            type: 'u64';
          },
          {
            name: 'created';
            type: 'i64';
          },
          {
            name: 'updated';
            type: 'i64';
          },
          {
            name: 'validUntil';
            type: 'i64';
          },
          {
            name: 'isPublic';
            type: 'bool';
          },
          {
            name: 'isActive';
            type: 'bool';
          },
        ];
      };
    },
  ];
  errors: [
    {
      code: 6000;
      name: 'OnlyProfileOwnerCanAccess';
      msg: 'OnlyProfileOwnerCanAccess';
    },
    {
      code: 6001;
      name: 'DocumentAlreadyDeleted';
      msg: 'DocumentAlreadyDeleted';
    },
  ];
};

export const IDL: Vault = {
  version: '0.1.0',
  name: 'vault',
  instructions: [
    {
      name: 'createProfile',
      accounts: [
        {
          name: 'profile',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'profileData',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: 'createProfileDocument',
      accounts: [
        {
          name: 'profile',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'document',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'profileData',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'name',
          type: 'string',
        },
      ],
    },
    {
      name: 'deleteProfileDocument',
      accounts: [
        {
          name: 'profile',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'document',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'profileData',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'documentIndex',
          type: 'u64',
        },
      ],
    },
    {
      name: 'createProfileDocumentShare',
      accounts: [
        {
          name: 'profile',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'documentShare',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'document',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'documentIndex',
          type: 'u64',
        },
        {
          name: 'invitee',
          type: 'publicKey',
        },
        {
          name: 'validUntil',
          type: 'i64',
        },
      ],
    },
    {
      name: 'toggleProfileDocumentShare',
      accounts: [
        {
          name: 'profile',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'documentShare',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'document',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'documentIndex',
          type: 'u64',
        },
        {
          name: 'invitee',
          type: 'publicKey',
        },
      ],
    },
  ],
  accounts: [
    {
      name: 'profileData',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'profile',
            type: 'publicKey',
          },
          {
            name: 'documentCount',
            type: 'u64',
          },
          {
            name: 'created',
            type: 'i64',
          },
          {
            name: 'updated',
            type: 'i64',
          },
        ],
      },
    },
    {
      name: 'documentData',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'profile',
            type: 'publicKey',
          },
          {
            name: 'name',
            type: 'string',
          },
          {
            name: 'index',
            type: 'u64',
          },
          {
            name: 'created',
            type: 'i64',
          },
          {
            name: 'deleted',
            type: 'bool',
          },
        ],
      },
    },
    {
      name: 'documentShareData',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'invitee',
            type: 'publicKey',
          },
          {
            name: 'documentIndex',
            type: 'u64',
          },
          {
            name: 'created',
            type: 'i64',
          },
          {
            name: 'updated',
            type: 'i64',
          },
          {
            name: 'validUntil',
            type: 'i64',
          },
          {
            name: 'isPublic',
            type: 'bool',
          },
          {
            name: 'isActive',
            type: 'bool',
          },
        ],
      },
    },
  ],
  errors: [
    {
      code: 6000,
      name: 'OnlyProfileOwnerCanAccess',
      msg: 'OnlyProfileOwnerCanAccess',
    },
    {
      code: 6001,
      name: 'DocumentAlreadyDeleted',
      msg: 'DocumentAlreadyDeleted',
    },
  ],
};
