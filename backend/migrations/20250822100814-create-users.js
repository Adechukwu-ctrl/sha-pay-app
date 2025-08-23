'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      first_name: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      last_name: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      user_type: {
        type: Sequelize.ENUM('service_provider', 'service_requester'),
        allowNull: false,
        defaultValue: 'service_requester'
      },
      profile_picture: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      date_of_birth: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      gender: {
        type: Sequelize.ENUM('male', 'female', 'other', 'prefer_not_to_say'),
        allowNull: true
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      city: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      state: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      country: {
        type: Sequelize.STRING(100),
        allowNull: true,
        defaultValue: 'Nigeria'
      },
      postal_code: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      latitude: {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: true
      },
      longitude: {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: true
      },
      is_email_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      is_phone_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      email_verification_token: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      phone_verification_code: {
        type: Sequelize.STRING(10),
        allowNull: true
      },
      password_reset_token: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      password_reset_expires: {
        type: Sequelize.DATE,
        allowNull: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      is_blocked: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      last_login_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      login_attempts: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      lock_until: {
        type: Sequelize.DATE,
        allowNull: true
      },
      two_factor_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      two_factor_secret: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      refresh_token: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      fcm_token: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      rating: {
        type: Sequelize.DECIMAL(3, 2),
        defaultValue: 0.00
      },
      total_ratings: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      completed_jobs: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      total_earnings: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0.00
      },
      available_balance: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0.00
      },
      pending_balance: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0.00
      },
      bio: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      skills: {
        type: Sequelize.JSON,
        allowNull: true
      },
      languages: {
        type: Sequelize.JSON,
        allowNull: true
      },
      availability: {
        type: Sequelize.JSON,
        allowNull: true
      },
      is_online: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      last_seen_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      preferences: {
        type: Sequelize.JSON,
        allowNull: true
      },
      social_links: {
        type: Sequelize.JSON,
        allowNull: true
      },
      documents: {
        type: Sequelize.JSON,
        allowNull: true
      },
      verification_status: {
        type: Sequelize.ENUM('pending', 'verified', 'rejected'),
        defaultValue: 'pending'
      },
      verification_notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // Add indexes
    await queryInterface.addIndex('users', ['email'], { unique: true });
    await queryInterface.addIndex('users', ['user_type']);
    await queryInterface.addIndex('users', ['is_active']);
    await queryInterface.addIndex('users', ['city', 'state']);
    await queryInterface.addIndex('users', ['rating']);
    await queryInterface.addIndex('users', ['is_online']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('users');
  }
};
