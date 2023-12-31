﻿// <auto-generated />
using System;
using Backend.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Backend.Migrations
{
    [DbContext(typeof(DataContext))]
    [Migration("20230629021646_add ticket model")]
    partial class addticketmodel
    {
        /// <inheritdoc />
        protected override void BuildTargetModel(ModelBuilder modelBuilder)
        {
#pragma warning disable 612, 618
            modelBuilder
                .HasAnnotation("ProductVersion", "7.0.5")
                .HasAnnotation("Relational:MaxIdentifierLength", 63);

            NpgsqlModelBuilderExtensions.UseIdentityByDefaultColumns(modelBuilder);

            modelBuilder.Entity("Backend.Models.Event", b =>
                {
                    b.Property<Guid>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("uuid");

                    b.Property<DateTime>("CreatedAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<string>("Description")
                        .IsRequired()
                        .HasMaxLength(100)
                        .HasColumnType("character varying(100)");

                    b.Property<DateTime>("EndDateTime")
                        .HasColumnType("timestamp with time zone");

                    b.Property<string>("Name")
                        .IsRequired()
                        .HasMaxLength(100)
                        .HasColumnType("character varying(100)");

                    b.Property<Guid>("OrganizerId")
                        .HasColumnType("uuid");

                    b.Property<Guid>("SportId")
                        .HasColumnType("uuid");

                    b.Property<Guid>("StadiumId")
                        .HasColumnType("uuid");

                    b.Property<DateTime>("StartDateTime")
                        .HasColumnType("timestamp with time zone");

                    b.Property<Guid>("TeamOneId")
                        .HasColumnType("uuid");

                    b.Property<Guid>("TeamTwoId")
                        .HasColumnType("uuid");

                    b.Property<DateTime>("UpdatedAt")
                        .HasColumnType("timestamp with time zone");

                    b.HasKey("Id");

                    b.HasIndex("OrganizerId");

                    b.HasIndex("SportId");

                    b.HasIndex("StadiumId");

                    b.HasIndex("TeamOneId");

                    b.HasIndex("TeamTwoId");

                    b.ToTable("event");
                });

            modelBuilder.Entity("Backend.Models.SeatReservation", b =>
                {
                    b.Property<Guid>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("uuid");

                    b.Property<DateTime>("CreatedAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<Guid>("EventId")
                        .HasColumnType("uuid");

                    b.Property<string>("SeatNumber")
                        .IsRequired()
                        .HasMaxLength(100)
                        .HasColumnType("character varying(100)");

                    b.Property<DateTime>("UpdatedAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<Guid>("UserId")
                        .HasColumnType("uuid");

                    b.HasKey("Id");

                    b.HasIndex("EventId");

                    b.HasIndex("UserId");

                    b.ToTable("seat_reservation");
                });

            modelBuilder.Entity("Backend.Models.Sport", b =>
                {
                    b.Property<Guid>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("uuid");

                    b.Property<DateTime>("CreatedAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<string>("Description")
                        .IsRequired()
                        .HasMaxLength(100)
                        .HasColumnType("character varying(100)");

                    b.Property<string>("Name")
                        .IsRequired()
                        .HasMaxLength(100)
                        .HasColumnType("character varying(100)");

                    b.Property<DateTime>("UpdatedAt")
                        .HasColumnType("timestamp with time zone");

                    b.HasKey("Id");

                    b.HasIndex("Name")
                        .IsUnique();

                    b.ToTable("sport");
                });

            modelBuilder.Entity("Backend.Models.Stadium", b =>
                {
                    b.Property<Guid>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("uuid");

                    b.Property<string>("Address")
                        .IsRequired()
                        .HasMaxLength(100)
                        .HasColumnType("character varying(100)");

                    b.Property<int>("Capacity")
                        .HasColumnType("integer");

                    b.Property<DateTime>("CreatedAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<string>("Name")
                        .IsRequired()
                        .HasMaxLength(100)
                        .HasColumnType("character varying(100)");

                    b.Property<DateTime>("UpdatedAt")
                        .HasColumnType("timestamp with time zone");

                    b.HasKey("Id");

                    b.ToTable("stadium");
                });

            modelBuilder.Entity("Backend.Models.Team", b =>
                {
                    b.Property<Guid>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("uuid");

                    b.Property<DateTime>("CreatedAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<string>("Name")
                        .IsRequired()
                        .HasMaxLength(100)
                        .HasColumnType("character varying(100)");

                    b.Property<Guid>("SportId")
                        .HasColumnType("uuid");

                    b.Property<DateTime>("UpdatedAt")
                        .HasColumnType("timestamp with time zone");

                    b.HasKey("Id");

                    b.HasIndex("Name")
                        .IsUnique();

                    b.HasIndex("SportId");

                    b.ToTable("team");
                });

            modelBuilder.Entity("Backend.Models.User", b =>
                {
                    b.Property<Guid>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("uuid");

                    b.Property<DateTime>("CreatedAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<string>("Email")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<bool>("IsActive")
                        .HasColumnType("boolean");

                    b.Property<string>("Name")
                        .IsRequired()
                        .HasMaxLength(100)
                        .HasColumnType("character varying(100)");

                    b.Property<string>("Password")
                        .IsRequired()
                        .HasMaxLength(100)
                        .HasColumnType("character varying(100)");

                    b.Property<int>("Role")
                        .HasColumnType("integer");

                    b.Property<DateTime>("UpdatedAt")
                        .HasColumnType("timestamp with time zone");

                    b.HasKey("Id");

                    b.HasIndex("Email")
                        .IsUnique();

                    b.ToTable("user");
                });

            modelBuilder.Entity("Backend.Models.Event", b =>
                {
                    b.HasOne("Backend.Models.User", "Organizer")
                        .WithMany("OrganizedEvents")
                        .HasForeignKey("OrganizerId")
                        .OnDelete(DeleteBehavior.Restrict)
                        .IsRequired()
                        .HasConstraintName("FK_Event_Organizer");

                    b.HasOne("Backend.Models.Sport", "Sport")
                        .WithMany("Events")
                        .HasForeignKey("SportId")
                        .OnDelete(DeleteBehavior.Restrict)
                        .IsRequired()
                        .HasConstraintName("FK_Event_Sport");

                    b.HasOne("Backend.Models.Stadium", "Stadium")
                        .WithMany("Events")
                        .HasForeignKey("StadiumId")
                        .OnDelete(DeleteBehavior.Restrict)
                        .IsRequired()
                        .HasConstraintName("FK_Event_Stadium");

                    b.HasOne("Backend.Models.Team", "TeamOne")
                        .WithMany("TeamOneEvents")
                        .HasForeignKey("TeamOneId")
                        .OnDelete(DeleteBehavior.Restrict)
                        .IsRequired()
                        .HasConstraintName("FK_Event_TeamOne");

                    b.HasOne("Backend.Models.Team", "TeamTwo")
                        .WithMany("TeamTwoEvents")
                        .HasForeignKey("TeamTwoId")
                        .OnDelete(DeleteBehavior.Restrict)
                        .IsRequired()
                        .HasConstraintName("FK_Event_TeamTwo");

                    b.Navigation("Organizer");

                    b.Navigation("Sport");

                    b.Navigation("Stadium");

                    b.Navigation("TeamOne");

                    b.Navigation("TeamTwo");
                });

            modelBuilder.Entity("Backend.Models.SeatReservation", b =>
                {
                    b.HasOne("Backend.Models.Event", "Event")
                        .WithMany("SeatReservations")
                        .HasForeignKey("EventId")
                        .OnDelete(DeleteBehavior.Restrict)
                        .IsRequired()
                        .HasConstraintName("FK_Event_SeatReservation");

                    b.HasOne("Backend.Models.User", "User")
                        .WithMany("SeatReservations")
                        .HasForeignKey("UserId")
                        .OnDelete(DeleteBehavior.Restrict)
                        .IsRequired()
                        .HasConstraintName("FK_User_SeatReservation");

                    b.Navigation("Event");

                    b.Navigation("User");
                });

            modelBuilder.Entity("Backend.Models.Team", b =>
                {
                    b.HasOne("Backend.Models.Sport", "Sport")
                        .WithMany("Teams")
                        .HasForeignKey("SportId")
                        .OnDelete(DeleteBehavior.Restrict)
                        .IsRequired()
                        .HasConstraintName("FK_Team_Sport");

                    b.Navigation("Sport");
                });

            modelBuilder.Entity("Backend.Models.Event", b =>
                {
                    b.Navigation("SeatReservations");
                });

            modelBuilder.Entity("Backend.Models.Sport", b =>
                {
                    b.Navigation("Events");

                    b.Navigation("Teams");
                });

            modelBuilder.Entity("Backend.Models.Stadium", b =>
                {
                    b.Navigation("Events");
                });

            modelBuilder.Entity("Backend.Models.Team", b =>
                {
                    b.Navigation("TeamOneEvents");

                    b.Navigation("TeamTwoEvents");
                });

            modelBuilder.Entity("Backend.Models.User", b =>
                {
                    b.Navigation("OrganizedEvents");

                    b.Navigation("SeatReservations");
                });
#pragma warning restore 612, 618
        }
    }
}
