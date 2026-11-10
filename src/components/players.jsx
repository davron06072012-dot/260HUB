
import React from "react";
import { UserPlus, MessageCircle, Users } from "lucide-react";

export default function Players({
  players = [],
  currentUser,
  onAddFriend,
  onMessage,
}) {
  if (!currentUser) {
    return (
      <div className="text-gray-400">
        Войдите в аккаунт, чтобы просматривать игроков.
      </div>
    );
  }

  // Убираем текущего пользователя из списка
  const otherPlayers = players.filter((player) => {
    return String(player.id) !== String(currentUser.id);
  });

  return (
    <section className="w-full">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white">
          Игроки
        </h2>

        <span className="text-sm text-gray-500">
          {otherPlayers.length} игроков
        </span>
      </div>

      {otherPlayers.length === 0 ? (
        <div className="rounded-2xl border border-[#262629] bg-[#151517] p-8 text-center">
          <Users
            className="mx-auto mb-3 text-gray-500"
            size={32}
          />

          <p className="text-gray-400">
            Другие игроки пока не найдены.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {otherPlayers.map((player) => (
            <article
              key={player.id}
              className="rounded-3xl border border-[#29292D] bg-[#151517] p-6 transition hover:border-[#FF5C05]/60"
            >
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF5C05] to-[#D93600] text-xl font-bold text-white">
                    {player.username?.charAt(0)?.toUpperCase() || "?"}
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {player.username}
                    </h3>

                    <p className="text-sm text-gray-500">
                      {player.favorite_game || "No game selected"}
                    </p>
                  </div>
                </div>

                <span className="h-3 w-3 rounded-full bg-gray-600" />
              </div>

              <p className="mb-6 min-h-6 text-sm text-gray-400">
                {player.bio || "Игрок пока не добавил описание."}
              </p>

              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  onClick={() => onAddFriend?.(player.id)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700"
                >
                  <UserPlus size={18} />
                  Добавить в друзья
                </button>

                <button
                  onClick={() => onMessage?.(player.id)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#FF5C05] px-4 py-3 font-semibold text-white transition hover:bg-[#E64F00]"
                >
                  <MessageCircle size={18} />
                  Написать
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
